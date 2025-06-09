from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    def _create_user(self, email, password=None, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model with email as the unique identifier instead of username"""
    USER_TYPE_CHOICES = (
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('supervisor', 'Supervisor'),
        ('planner', 'Production Planner'),
        ('operator', 'Machine Operator'),
        ('qc', 'Quality Control'),
        ('maintenance', 'Maintenance'),
        ('viewer', 'Read-Only Viewer'),
        ('worker', 'Production Worker'),  # Added for consistency
    )

    DEPARTMENT_CHOICES = (
        ('production', 'Production'),
        ('quality', 'Quality Control'),
        ('maintenance', 'Maintenance'),
        ('planning', 'Production Planning'),
        ('admin', 'Administration'),
        ('it', 'Information Technology'),
        ('logistics', 'Logistics'),
        ('engineering', 'Engineering'),
        ('finance', 'Finance'),
        ('hr', 'Human Resources'),
        ('other', 'Other'),
    )

    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('pending', 'Pending Activation'),
    )

    username = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    department = models.CharField(max_length=100, choices=DEPARTMENT_CHOICES, blank=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='operator')
    phone_number = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_activity = models.DateTimeField(null=True, blank=True)
    is_logged_in = models.BooleanField(default=False)
    login_attempts = models.PositiveIntegerField(default=0)
    last_login_attempt = models.DateTimeField(null=True, blank=True)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    password_changed_at = models.DateTimeField(auto_now_add=True)
    employee_id = models.CharField(max_length=50, blank=True, unique=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    
    # New security and management fields
    force_password_change = models.BooleanField(default=False)
    password_expires_at = models.DateTimeField(null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    backup_codes = models.JSONField(default=list, blank=True)
    supervisor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    notes = models.TextField(blank=True)
    emergency_contact = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_users')
    last_modified_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='modified_users')
    last_modified_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email

    def get_display_name(self):
        """Return full name if available, otherwise email"""
        return self.full_name if self.full_name else self.email

    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.user_type in ['admin', 'manager']

    def can_view_all_work_orders(self):
        """Check if user can view all work orders"""
        return self.user_type in ['admin', 'manager', 'supervisor', 'planner']

    def can_edit_work_orders(self):
        """Check if user can edit work orders"""
        return self.user_type in ['admin', 'manager', 'planner']

    def can_delete_work_orders(self):
        """Check if user can delete work orders"""
        return self.user_type in ['admin', 'manager']

    def can_manage_inventory(self):
        """Check if user can manage inventory"""
        return self.user_type in ['admin', 'manager', 'supervisor']

    def can_view_reports(self):
        """Check if user can view reports"""
        return self.user_type in ['admin', 'manager', 'supervisor', 'planner', 'qc']

    def is_admin_level(self):
        """Check if user has admin-level permissions"""
        return self.user_type in ['admin']

    def is_management_level(self):
        """Check if user has management-level permissions"""
        return self.user_type in ['admin', 'manager', 'supervisor']

    def has_permission(self, permission):
        """Check if user has specific permission"""
        permission_map = {
            'manage_users': self.can_manage_users(),
            'view_all_work_orders': self.can_view_all_work_orders(),
            'edit_work_orders': self.can_edit_work_orders(),
            'delete_work_orders': self.can_delete_work_orders(),
            'manage_inventory': self.can_manage_inventory(),
            'view_reports': self.can_view_reports(),
            'admin_access': self.is_admin_level(),
            'management_access': self.is_management_level(),
        }
        return permission_map.get(permission, False)

    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False

    def is_password_expired(self):
        """Check if password has expired"""
        if self.password_expires_at:
            return timezone.now() > self.password_expires_at
        return False

    def lock_account(self, duration_hours=24):
        """Lock account for specified duration"""
        self.account_locked_until = timezone.now() + timedelta(hours=duration_hours)
        self.save()

    def unlock_account(self):
        """Unlock account"""
        self.account_locked_until = None
        self.login_attempts = 0
        self.save()

    def increment_login_attempts(self):
        """Increment failed login attempts"""
        self.login_attempts += 1
        self.last_login_attempt = timezone.now()
        
        # Lock account after 5 failed attempts
        if self.login_attempts >= 5:
            self.lock_account()
        
        self.save()

    def reset_login_attempts(self):
        """Reset login attempts counter"""
        self.login_attempts = 0
        self.last_login_attempt = None
        self.save()

    def set_password_expiry(self, days=90):
        """Set password expiry date"""
        self.password_expires_at = timezone.now() + timedelta(days=days)
        self.save()

    def get_subordinates(self):
        """Get all subordinates for this user"""
        return User.objects.filter(supervisor=self)

    def can_manage_user(self, user):
        """Check if this user can manage another user"""
        if self.is_admin_level():
            return True
        if self.is_management_level():
            # Can manage users in same department or subordinates
            return user.department == self.department or user.supervisor == self
        return False


class UserPreference(models.Model):
    """User preferences and settings"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    dark_mode = models.BooleanField(default=False)
    notification_preferences = models.JSONField(default=dict)
    app_preferences = models.JSONField(default=dict)
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s preferences"


class UserSession(models.Model):
    """Track user sessions for security and management"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.email} - {self.ip_address}"


class UserActivityLog(models.Model):
    """Log user activities for audit purposes"""
    ACTION_CHOICES = (
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('password_change', 'Password Change'),
        ('profile_update', 'Profile Update'),
        ('user_create', 'User Created'),
        ('user_update', 'User Updated'),
        ('user_delete', 'User Deleted'),
        ('permission_change', 'Permission Change'),
        ('work_order_create', 'Work Order Created'),
        ('work_order_update', 'Work Order Updated'),
        ('work_order_delete', 'Work Order Deleted'),
        ('inventory_update', 'Inventory Updated'),
        ('other', 'Other Action'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    affected_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='affected_logs')
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.email} - {self.action} at {self.timestamp}"
