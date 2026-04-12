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

class AuthViewSet(viewsets.ViewSet):
    """
    API endpoint for user registration and email confirmation.
    """
    permission_classes = [permissions.AllowAny]

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
        Extends the default retrieve to include metrics.
        """
        instance = self.get_object()
        manager = ConsensusManager()
        
        serializer = self.get_serializer(instance)
        data = serializer.data
        data['verified_status'] = manager.get_verified_status(instance)
        data['loss_of_service_30d'] = manager.get_loss_of_service_percentage(instance, days=30)
        
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
        manager = ConsensusManager()
        verified_status = manager.get_verified_status(building)
        return Response({
            'bin': building.bin,
            'verified_status': verified_status
        })

    @action(detail=False, methods=['get'])
    def map(self, request):
        """
        Returns a list of buildings with coordinates and verified status for map display.
        """
        buildings = Building.objects.exclude(latitude__isnull=True)
        manager = ConsensusManager()
        
        results = []
        for building in buildings:
            results.append({
                'bin': building.bin,
                'address': building.address,
                'latitude': building.latitude,
                'longitude': building.longitude,
                'verified_status': manager.get_verified_status(building),
                'loss_of_service_30d': manager.get_loss_of_service_percentage(building)
            })
            
        return Response(results)

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
