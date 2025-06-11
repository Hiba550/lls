from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import json

User = get_user_model()

class NotificationTemplate(models.Model):
    """Templates for different types of notifications"""
    CATEGORY_CHOICES = [
        ('work_order', 'Work Order'),
        ('assembly', 'Assembly'),
        ('inventory', 'Inventory'),
        ('quality', 'Quality Control'),
        ('system', 'System'),
        ('maintenance', 'Maintenance'),
        ('user', 'User Management'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title_template = models.CharField(max_length=200)
    message_template = models.TextField()
    default_priority = models.CharField(max_length=10, default='medium')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.category})"

class Notification(models.Model):
    """Individual notifications for users"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='info')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    category = models.CharField(max_length=20)
    
    # Status tracking
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Action tracking
    action_url = models.URLField(blank=True, null=True)
    action_taken = models.BooleanField(default=False)
    action_taken_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata for flexible data storage
    metadata = models.JSONField(default=dict, blank=True)
    
    # Related object tracking (generic)
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['priority', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.recipient.email}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    def mark_action_taken(self):
        """Mark that user has taken action on this notification"""
        if not self.action_taken:
            self.action_taken = True
            self.action_taken_at = timezone.now()
            self.save()

class NotificationPreference(models.Model):
    """User preferences for notifications"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email notifications
    email_enabled = models.BooleanField(default=True)
    email_work_orders = models.BooleanField(default=True)
    email_assembly = models.BooleanField(default=True)
    email_inventory = models.BooleanField(default=True)
    email_quality = models.BooleanField(default=True)
    email_system = models.BooleanField(default=False)
    
    # In-app notifications
    app_enabled = models.BooleanField(default=True)
    app_work_orders = models.BooleanField(default=True)
    app_assembly = models.BooleanField(default=True)
    app_inventory = models.BooleanField(default=True)
    app_quality = models.BooleanField(default=True)
    app_system = models.BooleanField(default=True)
    
    # Priority thresholds
    min_priority_email = models.CharField(max_length=10, choices=Notification.PRIORITY_CHOICES, default='medium')
    min_priority_app = models.CharField(max_length=10, choices=Notification.PRIORITY_CHOICES, default='low')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Notification Preferences - {self.user.email}"

class NotificationLog(models.Model):
    """Log of all notification activities"""
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('sent', 'Sent'),
        ('read', 'Read'),
        ('action_taken', 'Action Taken'),
        ('deleted', 'Deleted'),
    ]
    
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.notification.title} - {self.action} at {self.timestamp}"
