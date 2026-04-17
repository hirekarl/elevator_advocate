from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.db.models import Q
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response

from orchestration.supervisor import Supervisor

from .logic import ConsensusManager
from .models import Building, UserProfile
from .serializers import (
    AdvocacyLogSerializer,
    BuildingSerializer,
    ElevatorReportSerializer,
    ReportStatusSerializer,
)
from .tasks import fetch_building_news


class AuthViewSet(viewsets.ViewSet):
    """
    API endpoint for user registration, email confirmation, and session management.
    """

    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["post"])
    def login(self, request):
        identity = request.data.get("username")  # Could be username or email
        password = request.data.get("password")

        if not identity or not password:
            return Response(
                {"error": "Please provide both username/email and password."},
                status=400,
            )

        # 1. Resolve username if an email was provided
        username = identity
        if "@" in identity:
            try:
                user_obj = User.objects.get(email__iexact=identity)
                username = user_obj.username
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                pass

        # 2. Authenticate
        user = authenticate(username=username, password=password)

        if user:
            token, _ = Token.objects.get_or_create(user=user)

            # Fetch primary building if associated
            primary_building = None
            from .models import UserProfile

            profile, _ = UserProfile.objects.get_or_create(user=user)
            if profile.primary_building:
                primary_building = {
                    "bin": profile.primary_building.bin,
                    "address": profile.primary_building.address,
                }

            return Response(
                {
                    "token": token.key,
                    "username": user.username,
                    "email": user.email,
                    "primary_building": primary_building,
                }
            )

        # 3. Differentiate for better user experience (Handle unconfirmed accounts)
        try:
            potential_user = User.objects.get(
                Q(username__iexact=identity) | Q(email__iexact=identity)
            )
            if not potential_user.is_active and potential_user.check_password(password):
                return Response(
                    {"error": "Please confirm your email before logging in."},
                    status=403,
                )
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            pass

        return Response(
            {"error": "Incorrect username or password. Please try again."}, status=401
        )

    @action(
        detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def logout(self, request):
        request.user.auth_token.delete()
        return Response({"message": "Successfully logged out."})

    @action(
        detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def set_primary_building(self, request):
        """
        Couples the authenticated user to a specific building BIN.
        """
        bin_id = request.data.get("bin")
        if not bin_id:
            return Response({"error": "BIN is required."}, status=400)

        try:
            building = Building.objects.get(bin=bin_id)
            from .models import UserProfile

            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.primary_building = building
            profile.save()
            return Response(
                {
                    "message": f"Successfully set {building.address} as your home building.",
                    "primary_building": {
                        "bin": building.bin,
                        "address": building.address,
                    },
                }
            )
        except Building.DoesNotExist:
            return Response({"error": "Building not found."}, status=404)

    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def whoami(self, request):
        """
        Returns the profile of the current authenticated user.
        Used by the frontend to sync state on load or refresh.
        """
        user = request.user
        primary_building = None
        from .models import UserProfile

        profile, _ = UserProfile.objects.get_or_create(user=user)
        if profile.primary_building:
            primary_building = {
                "bin": profile.primary_building.bin,
                "address": profile.primary_building.address,
            }

        return Response(
            {
                "username": user.username,
                "email": user.email,
                "primary_building": primary_building,
            }
        )

    @action(detail=False, methods=["post"])
    def signup(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if not all([username, email, password]):
            return Response({"error": "Missing required fields."}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=400)

        # MVP: activate immediately. Email confirmation to be restored before
        # wider distribution (requires transactional email backend + dynamic URL).
        user = User.objects.create_user(
            username=username, email=email, password=password
        )
        token, _ = Token.objects.get_or_create(user=user)
        profile, _ = UserProfile.objects.get_or_create(user=user)

        return Response(
            {
                "message": "Signup successful.",
                "token": token.key,
                "username": user.username,
                "primary_building": profile.primary_building.bin
                if profile.primary_building
                else None,
            },
            status=201,
        )

    @action(detail=False, methods=["post"])
    def confirm_email(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response(
                {"message": "Email confirmed! You can now log in."}, status=200
            )

        return Response({"error": "Invalid or expired confirmation link."}, status=400)


class BuildingViewSet(viewsets.ReadOnlyModelViewSet[Building]):
    """
    API endpoint for viewing buildings and their verified status.
    """

    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    lookup_field = "bin"
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        """
        Extends the default retrieve to include recent reports.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data

        # Include recent reports
        recent_reports = instance.reports.order_by("-reported_at")[:10]
        data["recent_reports"] = ElevatorReportSerializer(
            recent_reports, many=True
        ).data

        # Auto-fetch news on first visit if it has never been fetched.
        if not instance.last_news_refresh:
            fetch_building_news.enqueue(bin=instance.bin)

        return Response(data)

    @action(detail=True, methods=["get"])
    def status(self, request, bin=None):
        """
        Returns the current verified status for a specific building.
        """
        building = self.get_object()
        serializer = self.get_serializer(building)
        return Response(
            {"bin": building.bin, "verified_status": serializer.data["verified_status"]}
        )

    @action(detail=True, methods=["get"])
    def advocacy_summary(self, request, bin=None):
        """
        Returns the Executive Advocacy Summary for this building.

        Serves from cache when available. On a cache miss, generates lazily via
        Supervisor/Gemini and caches the result for subsequent requests. Returns
        503 if generation fails so the frontend can show a soft retry state.
        """
        building = self.get_object()
        lang = request.query_params.get("lang", "en")

        cache = building.cached_executive_summary or {}
        cached = cache.get(lang)

        if cached:
            return Response(cached)

        # Cache miss — generate lazily.
        manager = ConsensusManager()
        reports = building.reports.order_by("-reported_at")[:20]
        logs = building.advocacy_logs.order_by("-created_at")[:20]

        context = {
            "bin": building.bin,
            "address": building.address,
            "verified_status": manager.get_verified_status(building),
            "loss_of_service": manager.get_loss_of_service_percentage(building),
            "lang": lang,
            "reports": [
                {"status": r.status, "reported_at": str(r.reported_at)} for r in reports
            ],
            "logs": [
                {
                    "description": log.description,
                    "sr_number": log.sr_number,
                    "created_at": str(log.created_at),
                }
                for log in logs
            ],
        }

        try:
            summary = Supervisor().analyze(context)
        except Exception:
            summary = None

        if not summary:
            return Response(
                {"error": "Summary temporarily unavailable.", "retry": True},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        cache[lang] = summary.model_dump()
        building.cached_executive_summary = cache
        building.summary_last_generated = timezone.now()
        building.save(
            update_fields=["cached_executive_summary", "summary_last_generated"]
        )

        return Response(cache[lang])

    @action(detail=True, methods=["get"])
    def advocacy_script(self, request, bin=None):
        """
        Generates a 311 reporting script using Sol's AdvocacyStrategist.
        Supports 'lang' query parameter (e.g., ?lang=es).
        """
        building = self.get_object()
        lang = request.query_params.get("lang", "en")
        from .ai_logic import AdvocacyStrategist

        script_data = AdvocacyStrategist.generate_311_script(building, lang=lang)
        return Response(script_data)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def log_advocacy_action(self, request, bin=None):
        """
        Allows Martha or her niece to log a 311 complaint or legal action.
        """
        building = self.get_object()
        sr_number = request.data.get("sr_number")
        description = request.data.get("description", "")
        outcome = request.data.get("outcome", "Pending")

        if not sr_number:
            return Response(
                {"error": "Service Request (SR) number is required."}, status=400
            )

        from .models import AdvocacyLog

        log = AdvocacyLog.objects.create(
            building=building,
            user=request.user,
            sr_number=sr_number,
            description=description,
            outcome=outcome,
        )

        return Response(AdvocacyLogSerializer(log).data, status=201)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def refresh_news(self, request, bin=None):
        """
        Triggers a news refresh for this building.

        Enforces a 24-hour per-building cooldown to protect the SerpAPI quota
        (250 searches/month). The scheduled cron job (1st and 15th) bypasses
        this endpoint and calls the management command directly.
        """
        building = self.get_object()

        if building.last_news_refresh and (
            timezone.now() - building.last_news_refresh < timedelta(hours=24)
        ):
            next_refresh = building.last_news_refresh + timedelta(hours=24)
            return Response(
                {
                    "status": "COOLDOWN",
                    "message": "News was refreshed recently. Please try again later.",
                    "next_refresh_after": next_refresh.isoformat(),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        fetch_building_news.enqueue(bin=building.bin)
        building.refresh_from_db(fields=["last_news_refresh"])

        return Response(
            {
                "status": "REFRESHED",
                "last_refresh": building.last_news_refresh.isoformat()
                if building.last_news_refresh
                else None,
            }
        )

    @action(detail=False, methods=["get"])
    def lookup(self, request):
        """
        Retrieves a building by address (house_number, street, borough).
        Creates the building in the DB via Geoclient if it doesn't exist.
        """
        house_number = request.query_params.get("house_number")
        street = request.query_params.get("street")
        borough = request.query_params.get("borough")

        if not all([house_number, street, borough]):
            return Response(
                {"error": "Please provide house_number, street, and borough."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        manager = ConsensusManager()
        # We need to know if it was created to trigger the news search
        # Refactoring manager to return (building, created)
        building, created = manager.get_or_create_building_with_status(
            house_number, street, borough
        )

        if not building:
            return Response(
                {
                    "error": "Address not recognized.",
                    "message": f"'{house_number} {street}' in {borough} was not found in NYC's official building records. Please check the spelling or house number.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if created:
            from .tasks import fetch_building_news

            fetch_building_news.enqueue(bin=building.bin)

        serializer = self.get_serializer(building)
        data = serializer.data
        data["is_mocked"] = manager.is_mocked

        # Include recent reports (same as retrieve)
        recent_reports = building.reports.order_by("-reported_at")[:10]
        data["recent_reports"] = ElevatorReportSerializer(
            recent_reports, many=True
        ).data

        return Response(data)

    @action(detail=False, methods=["get"])
    def map(self, request):
        """
        Returns a list of buildings with coordinates and verified status for map display.
        """
        buildings = Building.objects.exclude(latitude__isnull=True)
        serializer = self.get_serializer(buildings, many=True)
        return Response(serializer.data)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def report_status(self, request, bin=None):
        """
        Directly logs a status report for a specific building via its BIN.
        This is the preferred endpoint for 'Martha-mode' quick reporting.
        """
        building = self.get_object()
        status_value = request.data.get("status")

        if not status_value:
            return Response({"error": "Status is required."}, status=400)

        # Validate status choice
        from .models import ElevatorReport

        valid_statuses = [s[0] for s in ElevatorReport.STATUS_CHOICES]
        if status_value not in valid_statuses:
            return Response(
                {
                    "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                },
                status=400,
            )

        manager = ConsensusManager()
        report = manager.report_status(
            building=building,
            user=request.user,
            status=status_value,
        )

        return Response(
            ElevatorReportSerializer(report).data, status=status.HTTP_201_CREATED
        )


class ReportViewSet(viewsets.ViewSet):
    """
    API endpoint for reporting elevator status via address.
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def create(self, request):
        serializer = ReportStatusSerializer(data=request.data)
        if serializer.is_valid():
            manager = ConsensusManager()
            building = manager.get_or_create_building(
                house_number=serializer.validated_data["house_number"],
                street=serializer.validated_data["street"],
                borough=serializer.validated_data["borough"],
            )

            if not building:
                return Response(
                    {"error": "Building not found in NYC Geoclient."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            report = manager.report_status(
                building=building,
                user=request.user,
                status=serializer.validated_data["status"],
            )

            return Response(
                ElevatorReportSerializer(report).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
