from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Building, ElevatorReport
from .serializers import BuildingSerializer, ElevatorReportSerializer, ReportStatusSerializer
from .logic import ConsensusManager

from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.db.models import Q

class AuthViewSet(viewsets.ViewSet):
    """
    API endpoint for user registration, email confirmation, and session management.
    """
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        identity = request.data.get('username') # Could be username or email
        password = request.data.get('password')

        if not identity or not password:
            return Response({"error": "Please provide both username/email and password."}, status=400)

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
            if hasattr(user, 'profile') and user.profile.primary_building:
                primary_building = {
                    "bin": user.profile.primary_building.bin,
                    "address": user.profile.primary_building.address
                }

            return Response({
                "token": token.key,
                "username": user.username,
                "email": user.email,
                "primary_building": primary_building
            })

        # 3. Differentiate for better user experience (Handle unconfirmed accounts)
        try:
            potential_user = User.objects.get(Q(username__iexact=identity) | Q(email__iexact=identity))
            if not potential_user.is_active and potential_user.check_password(password):
                return Response({"error": "Please confirm your email before logging in."}, status=403)
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            pass

        return Response({"error": "Incorrect username or password. Please try again."}, status=401)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        request.user.auth_token.delete()
        return Response({"message": "Successfully logged out."})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def set_primary_building(self, request):
        """
        Couples the authenticated user to a specific building BIN.
        """
        bin_id = request.data.get('bin')
        if not bin_id:
            return Response({"error": "BIN is required."}, status=400)
            
        try:
            building = Building.objects.get(bin=bin_id)
            profile = request.user.profile
            profile.primary_building = building
            profile.save()
            return Response({
                "message": f"Successfully set {building.address} as your home building.",
                "primary_building": {"bin": building.bin, "address": building.address}
            })
        except Building.DoesNotExist:
            return Response({"error": "Building not found."}, status=404)

    @action(detail=False, methods=['post'])
    def signup(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([username, email, password]):
            return Response({"error": "Missing required fields."}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        user.is_active = False  # Deactivate until email is confirmed
        user.save()

        # Generate confirmation link
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        confirm_url = f"http://localhost:5173/confirm/{uid}/{token}/"

        # Send email (console in dev)
        send_mail(
            "Confirm Your Account",
            f"Welcome to Elevator Advocacy! Click here to confirm your email: {confirm_url}",
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        return Response({"message": "Signup successful. Check your terminal (local dev) or email for confirmation link."}, status=201)

    @action(detail=False, methods=['post'])
    def confirm_email(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({"message": "Email confirmed! You can now log in."}, status=200)
        
        return Response({"error": "Invalid or expired confirmation link."}, status=400)

class BuildingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing buildings and their verified status.
    """
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    lookup_field = 'bin'
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        """
        Extends the default retrieve to include recent reports.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Include recent reports
        recent_reports = instance.reports.order_by('-reported_at')[:10]
        data['recent_reports'] = ElevatorReportSerializer(recent_reports, many=True).data
        
        return Response(data)

    @action(detail=True, methods=['get'])
    def status(self, request, bin=None):
        """
        Returns the current verified status for a specific building.
        """
        building = self.get_object()
        serializer = self.get_serializer(building)
        return Response({
            'bin': building.bin,
            'verified_status': serializer.data['verified_status']
        })

    @action(detail=True, methods=['get'])
    def advocacy_script(self, request, bin=None):
        """
        Generates a 311 reporting script using Sol's AdvocacyStrategist.
        """
        building = self.get_object()
        from .ai_logic import AdvocacyStrategist
        script_data = AdvocacyStrategist.generate_311_script(building)
        return Response(script_data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def refresh_news(self, request, bin=None):
        """
        Manually triggers the news extraction task for this building.
        Requires authentication and enforces a 24-hour cooldown per building.
        """
        from django.utils import timezone
        from datetime import timedelta
        
        building = self.get_object()
        now = timezone.now()
        
        # TEMPORARILY DISABLED: Enforce 24-hour cooldown
        # if building.last_news_refresh and (now - building.last_news_refresh) < timedelta(hours=24):
        #     remaining_seconds = int((timedelta(hours=24) - (now - building.last_news_refresh)).total_seconds())
        #     remaining_hours = remaining_seconds // 3600
        #     remaining_minutes = (remaining_seconds % 3600) // 60
        #     
        #     return Response({
        #         "error": "Cooldown in effect.",
        #         "message": f"News can only be refreshed once every 24 hours. Please try again in {remaining_hours}h {remaining_minutes}m.",
        #         "cooldown_remaining": remaining_seconds
        #     }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        from .tasks import fetch_building_news
        
        # Update last refresh timestamp immediately to prevent race conditions
        building.last_news_refresh = now
        building.save(update_fields=['last_news_refresh'])
        
        # Enqueue the task using Django 6.0 Task Framework
        fetch_building_news.enqueue(bin=building.bin)
        
        return Response({
            "message": f"News refresh for {building.address} has been queued.",
            "status": "QUEUED"
        })

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        """
        Retrieves a building by address (house_number, street, borough).
        Creates the building in the DB via Geoclient if it doesn't exist.
        """
        house_number = request.query_params.get('house_number')
        street = request.query_params.get('street')
        borough = request.query_params.get('borough')

        if not all([house_number, street, borough]):
            return Response(
                {"error": "Please provide house_number, street, and borough."},
                status=status.HTTP_400_BAD_REQUEST
            )

        manager = ConsensusManager()
        # We need to know if it was created to trigger the news search
        # Refactoring manager to return (building, created)
        building, created = manager.get_or_create_building_with_status(house_number, street, borough)

        if not building:
            return Response(
                {
                    "error": "Address not recognized.",
                    "message": f"'{house_number} {street}' in {borough} was not found in NYC's official building records. Please check the spelling or house number."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if created:
            from .tasks import fetch_building_news
            fetch_building_news.enqueue(bin=building.bin)

        serializer = self.get_serializer(building)
        data = serializer.data
        
        # Include recent reports (same as retrieve)
        recent_reports = building.reports.order_by('-reported_at')[:10]
        data['recent_reports'] = ElevatorReportSerializer(recent_reports, many=True).data
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def map(self, request):
        """
        Returns a list of buildings with coordinates and verified status for map display.
        """
        buildings = Building.objects.exclude(latitude__isnull=True)
        serializer = self.get_serializer(buildings, many=True)
        return Response(serializer.data)

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
                house_number=serializer.validated_data['house_number'],
                street=serializer.validated_data['street'],
                borough=serializer.validated_data['borough']
            )

            if not building:
                return Response(
                    {"error": "Building not found in NYC Geoclient."},
                    status=status.HTTP_404_NOT_FOUND
                )

            report = manager.report_status(
                building=building,
                user=request.user,
                status=serializer.validated_data['status']
            )

            return Response(
                ElevatorReportSerializer(report).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
