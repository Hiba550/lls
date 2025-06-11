from django.contrib import admin
from .models import Notification, NotificationTemplate, NotificationPreference, NotificationLog

@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'default_priority', 'is_active', 'created_at']
    list_filter = ['category', 'default_priority', 'is_active']
    search_fields = ['name', 'title_template', 'message_template']
    ordering = ['category', 'name']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'recipient', 'category', 'notification_type', 'priority', 'is_read', 'created_at']
    list_filter = ['category', 'notification_type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__email', 'recipient__full_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('recipient', 'title', 'message', 'category')
        }),
        ('Classification', {
            'fields': ('notification_type', 'priority', 'template')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'action_taken', 'action_taken_at')
        }),
        ('Action & Related Data', {
            'fields': ('action_url', 'related_object_type', 'related_object_id', 'metadata')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_enabled', 'app_enabled', 'min_priority_email', 'min_priority_app']
    list_filter = ['email_enabled', 'app_enabled', 'min_priority_email', 'min_priority_app']
    search_fields = ['user__email', 'user__full_name']

@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['notification', 'action', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['notification__title', 'notification__recipient__email']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp']
