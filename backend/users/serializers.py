from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import UserPreference, UserSession, UserActivityLog

User = get_user_model()


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ['dark_mode', 'notification_preferences', 'app_preferences', 'language', 'timezone']


class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = ['id', 'ip_address', 'user_agent', 'location', 'is_active', 'created_at', 'last_activity']


class UserActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    affected_user_email = serializers.CharField(source='affected_user.email', read_only=True)

    class Meta:
        model = UserActivityLog
        fields = ['id', 'user_email', 'action', 'description', 'timestamp', 'affected_user_email', 'metadata']


class UserSerializer(serializers.ModelSerializer):
    preferences = UserPreferenceSerializer(read_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    active_sessions = UserSessionSerializer(source='sessions', many=True, read_only=True)
    permissions = serializers.SerializerMethodField()
    department_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    supervisor_name = serializers.CharField(source='supervisor.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    last_modified_by_name = serializers.CharField(source='last_modified_by.full_name', read_only=True)
    is_account_locked = serializers.SerializerMethodField()
    password_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'user_type', 'department', 'department_display',
                'phone_number', 'avatar', 'is_active', 'employee_id', 'last_activity', 
                'is_logged_in', 'date_joined', 'last_login', 'preferences', 'active_sessions',
                'permissions', 'password_changed_at', 'status', 'status_display', 
                'supervisor', 'supervisor_name', 'account_locked_until', 'is_account_locked',
                'force_password_change', 'password_expires_at', 'password_expired',
                'two_factor_enabled', 'emergency_contact', 'notes', 
                'created_by', 'created_by_name', 'last_modified_by', 'last_modified_by_name', 
                'last_modified_at']
        read_only_fields = ['id', 'date_joined', 'last_login', 'last_activity', 'is_logged_in', 
                          'password_changed_at', 'created_by', 'last_modified_by', 'last_modified_at']
    
    def get_permissions(self, obj):
        """Return user permissions for frontend"""
        return {
            'can_manage_users': obj.can_manage_users(),
            'can_view_all_work_orders': obj.can_view_all_work_orders(),
            'can_edit_work_orders': obj.can_edit_work_orders(),
            'can_delete_work_orders': obj.can_delete_work_orders(),
            'can_manage_inventory': obj.can_manage_inventory(),
            'can_view_reports': obj.can_view_reports(),
            'is_admin_level': obj.is_admin_level(),
            'is_management_level': obj.is_management_level(),
        }

    def get_department_display(self, obj):
        """Return human-readable department name"""
        return dict(User.DEPARTMENT_CHOICES).get(obj.department, obj.department)
    
    def get_status_display(self, obj):
        """Return human-readable status"""
        return dict(User.STATUS_CHOICES).get(obj.status, obj.status)
    
    def get_is_account_locked(self, obj):
        """Check if account is currently locked"""
        return obj.is_account_locked()
    
    def get_password_expired(self, obj):
        """Check if password has expired"""
        return obj.is_password_expired()
    
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Add a human-readable label for the user type
        rep['user_type_display'] = dict(User.USER_TYPE_CHOICES).get(instance.user_type, instance.user_type)
        if instance.avatar:
            request = self.context.get('request')
            if request:
                rep['avatar'] = request.build_absolute_uri(instance.avatar.url)
        return rep
    
    def update(self, instance, validated_data):
        # If avatar is empty string or None, don't update it
        if 'avatar' in validated_data and not validated_data['avatar']:
            validated_data.pop('avatar')
        return super().update(instance, validated_data)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'full_name', 'department', 
                 'user_type', 'phone_number', 'employee_id', 'supervisor', 'emergency_contact',
                 'notes', 'status']
    
    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password": "Password fields don't match."})
        
        # Validate employee ID uniqueness if provided
        if attrs.get('employee_id'):
            if User.objects.filter(employee_id=attrs['employee_id']).exists():
                raise serializers.ValidationError({"employee_id": "Employee ID already exists."})
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Set created_by if available in context
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create default preferences for the user
        UserPreference.objects.create(
            user=user,
            notification_preferences={
                'emailNotifications': True,
                'workOrderUpdates': True,
                'inventoryAlerts': True,
                'systemAnnouncements': False,
                'maintenanceAlerts': True,
                'qualityAlerts': False
            },
            app_preferences={
                'defaultView': 'grid',
                'autoRefresh': True,
                'refreshInterval': 30,
                'showCompletedWorkOrders': True,
                'itemsPerPage': 10,
                'defaultSortOrder': 'desc'
            }
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information"""
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['full_name', 'department', 'user_type', 'phone_number', 'employee_id', 
                 'is_active', 'password', 'supervisor', 'emergency_contact', 'notes', 
                 'status', 'force_password_change', 'account_locked_until']
    
    def validate_employee_id(self, value):
        """Validate employee ID uniqueness"""
        if value and self.instance:
            if User.objects.filter(employee_id=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Employee ID already exists.")
        return value
    
    def update(self, instance, validated_data):
        # Handle password update separately
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
            instance.password_changed_at = timezone.now()
            # Clear force password change flag if set
            if instance.force_password_change:
                instance.force_password_change = False
        
        # Set last_modified_by if available in context
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['last_modified_by'] = request.user
            validated_data['last_modified_at'] = timezone.now()
        
        return super().update(instance, validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'}, write_only=True)
    

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"new_password": "Password fields don't match."})
        
        # Add password strength validation
        password = attrs.get('new_password')
        if len(password) < 8:
            raise serializers.ValidationError({"new_password": "Password must be at least 8 characters long."})
        
        return attrs


class BulkUserUpdateSerializer(serializers.Serializer):
    """Serializer for bulk user operations"""
    user_ids = serializers.ListField(child=serializers.IntegerField())
    action = serializers.ChoiceField(choices=['activate', 'deactivate', 'delete', 'change_role', 'change_department', 'unlock_account'])
    new_role = serializers.CharField(required=False)
    new_department = serializers.CharField(required=False)
    
    def validate(self, attrs):
        if attrs.get('action') == 'change_role' and not attrs.get('new_role'):
            raise serializers.ValidationError({"new_role": "New role is required for role change action."})
        if attrs.get('action') == 'change_department' and not attrs.get('new_department'):
            raise serializers.ValidationError({"new_department": "New department is required for department change action."})
        return attrs


class UserSecuritySerializer(serializers.ModelSerializer):
    """Serializer for user security settings"""
    class Meta:
        model = User
        fields = ['two_factor_enabled', 'force_password_change', 'account_locked_until', 
                 'password_expires_at']
        

class UserPasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset"""
    user_id = serializers.IntegerField()
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    force_change = serializers.BooleanField(default=True)


class UserImportSerializer(serializers.Serializer):
    """Serializer for importing users from CSV"""
    file = serializers.FileField()
    
    def validate_file(self, value):
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("Only CSV files are supported")
        return value


class UserStatsSerializer(serializers.Serializer):
    """Serializer for user statistics"""
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    inactive_users = serializers.IntegerField()
    suspended_users = serializers.IntegerField()
    pending_users = serializers.IntegerField()
    users_by_role = serializers.DictField()
    users_by_department = serializers.DictField()
    recent_logins = serializers.IntegerField()
    locked_accounts = serializers.IntegerField()