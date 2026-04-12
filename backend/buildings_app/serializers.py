from rest_framework import serializers

from .models import AdvocacyLog, Building, BuildingNews, ElevatorReport


class BuildingNewsSerializer(serializers.ModelSerializer):
    """
    Serializer for local news articles related to a building.
    """
    class Meta:
        model = BuildingNews
        fields = ['title', 'url', 'source', 'published_date', 'summary', 'relevance_score']

class AdvocacyLogSerializer(serializers.ModelSerializer):
    """
    Tracks the paper trail for specific users (Martha, Niece).
    """
    class Meta:
        model = AdvocacyLog
        fields = ['id', 'sr_number', 'description', 'outcome', 'created_at']

class BuildingSerializer(serializers.ModelSerializer):
    """
    Serializer for NYC Building data.
    """
    verified_status = serializers.SerializerMethodField()
    loss_of_service_30d = serializers.SerializerMethodField()
    failure_risk = serializers.SerializerMethodField()
    verification_countdown = serializers.SerializerMethodField()
    news_articles = BuildingNewsSerializer(many=True, read_only=True)
    advocacy_logs = serializers.SerializerMethodField()

    class Meta:
        model = Building
        fields = [
            'bin', 'address', 'borough', 'latitude', 'longitude', 
            'created_at', 'verified_status', 'loss_of_service_30d', 
            'failure_risk', 'verification_countdown', 'news_articles',
            'advocacy_logs'
        ]

    def get_advocacy_logs(self, obj: Building) -> list:
        """
        Returns ONLY the logs for the current requesting user, 
        maintaining privacy for Martha and her niece.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        logs = obj.advocacy_logs.filter(user=request.user)
        return AdvocacyLogSerializer(logs, many=True).data

    def get_verified_status(self, obj: Building) -> str:
        from .logic import ConsensusManager
        return ConsensusManager().get_verified_status(obj)

    def get_verification_countdown(self, obj: Building) -> int:
        from .logic import ConsensusManager
        return ConsensusManager().get_verification_countdown(obj)

    def get_loss_of_service_30d(self, obj: Building) -> float:
        from .logic import ConsensusManager
        return ConsensusManager().get_loss_of_service_percentage(obj, days=30)

    def get_failure_risk(self, obj: Building) -> dict:
        from .ai_logic import PredictiveEngine
        return PredictiveEngine.calculate_failure_risk(obj)

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
