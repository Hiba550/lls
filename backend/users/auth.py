from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()

class EmployeeIdBackend(ModelBackend):
    """
    Custom authentication backend to login with employee_id instead of username
    """
    def authenticate(self, request, username=None, employee_id=None, password=None, **kwargs):
        # Try to get the employee_id from either the employee_id or username field
        if employee_id is None:
            employee_id = username
            
        if employee_id is None or password is None:
            return None
            
        try:
            user = User.objects.get(employee_id=employee_id)
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except User.DoesNotExist:
            # No user with this employee_id exists
            return None
        
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None