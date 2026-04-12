from rest_framework import serializers
from .models import Building, ElevatorReport

class BuildingSerializer(serializers.ModelSerializer):
    """
    Serializer for NYC Building data.
    """
    class Meta:
        model = Building
        fields = ['bin', 'address', 'borough', 'created_at']

class ElevatorReportSerializer(serializers.ModelSerializer):
    """
    Serializer for user-submitted elevator reports.
    """
    class Meta:
        model = ElevatorReport
        fields = ['building', 'user_id', 'status', 'reported_at', 'is_official']
        read_only_fields = ['reported_at', 'is_official']

class ReportStatusSerializer(serializers.Serializer):
    """
    Surgical serializer for reporting a status via address.
    Used by the frontend to report status without knowing the BIN.
    """
    house_number = serializers.CharField(max_length=10)
    street = serializers.CharField(max_length=100)
    borough = serializers.CharField(max_length=20)
    status = serializers.ChoiceField(choices=ElevatorReport.STATUS_CHOICES)
