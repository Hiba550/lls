from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification, NotificationTemplate, NotificationPreference, NotificationLog

User = get_user_model()

class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority', 'category',
            'is_read', 'read_at', 'action_url', 'action_taken', 'action_taken_at',
            'metadata', 'related_object_type', 'related_object_id',
            'created_at', 'updated_at', 'recipient_name', 'template_name', 'time_ago'
        ]
        read_only_fields = ['created_at', 'updated_at', 'recipient_name', 'template_name', 'time_ago']
    
    def get_time_ago(self, obj):
        """Calculate time ago for frontend display"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes}m ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours}h ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days}d ago"
        else:
            return obj.created_at.strftime("%b %d")

class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""
    
    class Meta:
        model = Notification
        fields = [
            'recipient', 'title', 'message', 'notification_type', 'priority', 
            'category', 'action_url', 'metadata', 'related_object_type', 'related_object_id'
        ]
    
    def create(self, validated_data):
        notification = Notification.objects.create(**validated_data)
        
        # Create log entry
        NotificationLog.objects.create(
            notification=notification,
            action='created',
            metadata={'created_by': 'system'}
        )
        
        return notification

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        exclude = ['user']

class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = '__all__'

class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    total_notifications = serializers.IntegerField()
    unread_count = serializers.IntegerField()
    today_count = serializers.IntegerField()
    high_priority_count = serializers.IntegerField()
    categories = serializers.DictField()
    
class BulkMarkReadSerializer(serializers.Serializer):
    """Serializer for bulk marking notifications as read"""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of notification IDs to mark as read. If empty, marks all as read."
    )
    
class NotificationActionSerializer(serializers.Serializer):
    """Serializer for notification actions"""
    action = serializers.ChoiceField(choices=['mark_read', 'mark_unread', 'delete', 'take_action'])
    notification_ids = serializers.ListField(child=serializers.IntegerField())
