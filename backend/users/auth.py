from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()

class EmailBackend(ModelBackend):
    """
    Custom authentication backend to login with email instead of username
    """
    def authenticate(self, request, username=None, email=None, password=None, **kwargs):
        # Try to get the email from either the email or username field
        if email is None:
            email = username
            
        if email is None or password is None:
            return None
            
        try:
            user = User.objects.get(email=email)
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except User.DoesNotExist:
            # No user with this email exists
            return None
        
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None