from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserPreference

User = get_user_model()


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ['dark_mode', 'notification_preferences', 'app_preferences']


class UserSerializer(serializers.ModelSerializer):
    preferences = UserPreferenceSerializer(read_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'user_type', 'department', 
                'phone_number', 'avatar', 'is_active', 'date_joined', 'last_login', 'preferences']
        read_only_fields = ['id', 'date_joined', 'last_login']
    
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
        fields = ['email', 'password', 'password_confirm', 'full_name', 'department', 'user_type', 'phone_number']
    
    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password": "Password fields don't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
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
                'systemAnnouncements': False
            },
            app_preferences={
                'defaultView': 'grid',
                'autoRefresh': True,
                'refreshInterval': 5,
                'showCompletedWorkOrders': True
            }
        )
        return user


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
        return attrs