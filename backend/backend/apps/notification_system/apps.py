from django.apps import AppConfig


class NotificationSystemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.apps.notification_system'
    verbose_name = 'Notification System'
    
    def ready(self):
        """Import signal handlers when the app is ready"""
        try:
            import backend.apps.notification_system.signals
        except ImportError:
            pass
