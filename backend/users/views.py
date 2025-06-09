from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
from django.core.paginator import Paginator

from .models import UserPreference, UserSession, UserActivityLog
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserPreferenceSerializer,
    UserSessionSerializer,
    UserActivityLogSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    BulkUserUpdateSerializer,
    UserSecuritySerializer,
    UserPasswordResetSerializer,
    UserImportSerializer,
    UserStatsSerializer
)

User = get_user_model()


class IsAdminOrSelf(permissions.BasePermission):
    """Allow access to admin users or the user themselves."""
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or request.user == obj


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing user instances."""
    serializer_class = UserSerializer
    queryset = User.objects.all()
    
    def get_permissions(self):
        """Set custom permissions for different actions."""
        if self.action in ['create', 'list', 'bulk_update', 'user_stats', 'import_users']:
            permission_classes = [IsAdminUser]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            permission_classes = [IsAdminOrSelf]
        elif self.action == 'destroy':
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter and search users based on query parameters."""
        queryset = User.objects.select_related('supervisor', 'created_by', 'last_modified_by').all()
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(employee_id__icontains=search)
            )
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(user_type=role)
        
        # Filter by department
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department=department)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-date_joined')
        
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get the current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Log in a user and return authentication tokens"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get('email')
            password = serializer.validated_data.get('password')
            user = authenticate(request, email=email, password=password)
            
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user's password"""
        serializer = PasswordChangeSerializer(data=request.data)
        user = request.user
        
        if serializer.is_valid():
            # Check old password
            if not user.check_password(serializer.validated_data.get('old_password')):
                return Response({'old_password': ['Wrong password']}, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(serializer.validated_data.get('new_password'))
            user.save()
            return Response({'status': 'password changed'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout the user by blacklisting the refresh token"""
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            print(f"User {request.user.email} logged out successfully")
            return Response({"success": "Successfully logged out"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            print(f"Logout error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Add debug code to avatar method
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def avatar(self, request):
        """Upload user avatar"""
        print("Avatar upload request received with files:", request.FILES)
        
        # Check for 'avatar' instead of 'file'
        if 'avatar' not in request.FILES:
            print("No 'avatar' found in request.FILES")
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['avatar']
        user = request.user
        user.avatar = file
        user.save()
        
        print(f"Avatar saved for user {user.email}")
        return Response({
            "success": "Avatar uploaded successfully",
            "avatar_url": request.build_absolute_uri(user.avatar.url) if user.avatar else None
        })
    
    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_me(self, request):
        """Update the current user's profile"""
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_update(self, request):
        """Perform bulk operations on users"""
        serializer = BulkUserUpdateSerializer(data=request.data)
        if serializer.is_valid():
            user_ids = serializer.validated_data['user_ids']
            action = serializer.validated_data['action']
            
            users = User.objects.filter(id__in=user_ids)
            if not users.exists():
                return Response({'error': 'No users found'}, status=status.HTTP_404_NOT_FOUND)
            
            updated_count = 0
            
            if action == 'activate':
                updated_count = users.update(is_active=True, status='active')
            elif action == 'deactivate':
                updated_count = users.update(is_active=False, status='inactive')
            elif action == 'delete':
                updated_count = users.count()
                users.delete()
            elif action == 'change_role':
                new_role = serializer.validated_data['new_role']
                updated_count = users.update(user_type=new_role)
            elif action == 'change_department':
                new_department = serializer.validated_data['new_department']
                updated_count = users.update(department=new_department)
            elif action == 'unlock_account':
                updated_count = users.update(account_locked_until=None)
            
            # Log the bulk action
            UserActivityLog.objects.create(
                user=request.user,
                action=f'bulk_{action}',
                description=f'Bulk {action} performed on {updated_count} users',
                metadata={'user_ids': user_ids, 'action': action}
            )
            
            return Response({
                'success': f'{action.title()} completed for {updated_count} users'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def user_stats(self, request):
        """Get user statistics"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        suspended_users = User.objects.filter(status='suspended').count()
        pending_users = User.objects.filter(status='pending').count()
        locked_accounts = User.objects.filter(account_locked_until__gt=timezone.now()).count()
        
        # Users by role
        users_by_role = {}
        for choice in User.USER_TYPE_CHOICES:
            role = choice[0]
            count = User.objects.filter(user_type=role).count()
            users_by_role[role] = count
        
        # Users by department
        users_by_department = {}
        for choice in User.DEPARTMENT_CHOICES:
            dept = choice[0]
            count = User.objects.filter(department=dept).count()
            users_by_department[dept] = count
        
        # Recent logins (last 7 days)
        recent_logins = User.objects.filter(
            last_login__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
        
        stats_data = {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'suspended_users': suspended_users,
            'pending_users': pending_users,
            'users_by_role': users_by_role,
            'users_by_department': users_by_department,
            'recent_logins': recent_logins,
            'locked_accounts': locked_accounts
        }
        
        serializer = UserStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reset_password(self, request, pk=None):
        """Reset user password"""
        user = self.get_object()
        serializer = UserPasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            new_password = serializer.validated_data['new_password']
            force_change = serializer.validated_data.get('force_change', True)
            
            user.set_password(new_password)
            user.password_changed_at = timezone.now()
            user.force_password_change = force_change
            user.save()
            
            # Log the password reset
            UserActivityLog.objects.create(
                user=request.user,
                action='password_reset',
                description=f'Password reset for user {user.email}',
                affected_user=user
            )
            
            return Response({'success': 'Password reset successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def lock_account(self, request, pk=None):
        """Lock user account"""
        user = self.get_object()
        duration_hours = request.data.get('duration_hours', 24)
        
        user.account_locked_until = timezone.now() + timezone.timedelta(hours=duration_hours)
        user.save()
        
        # Log the account lock
        UserActivityLog.objects.create(
            user=request.user,
            action='account_locked',
            description=f'Account locked for {duration_hours} hours',
            affected_user=user,
            metadata={'duration_hours': duration_hours}
        )
        
        return Response({'success': f'Account locked for {duration_hours} hours'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def unlock_account(self, request, pk=None):
        """Unlock user account"""
        user = self.get_object()
        user.account_locked_until = None
        user.save()
        
        # Log the account unlock
        UserActivityLog.objects.create(
            user=request.user,
            action='account_unlocked',
            description='Account unlocked manually',
            affected_user=user
        )
        
        return Response({'success': 'Account unlocked successfully'})
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def import_users(self, request):
        """Import users from CSV file"""
        serializer = UserImportSerializer(data=request.data)
        if serializer.is_valid():
            csv_file = serializer.validated_data['file']
            
            try:
                import csv
                import io
                
                # Read CSV file
                file_data = csv_file.read().decode('utf-8')
                csv_reader = csv.DictReader(io.StringIO(file_data))
                
                created_users = []
                errors = []
                
                for row_num, row in enumerate(csv_reader, start=2):
                    try:
                        # Validate required fields
                        if not row.get('email') or not row.get('full_name'):
                            errors.append(f"Row {row_num}: Email and full name are required")
                            continue
                        
                        # Check if user already exists
                        if User.objects.filter(email=row['email']).exists():
                            errors.append(f"Row {row_num}: User with email {row['email']} already exists")
                            continue
                        
                        # Create user
                        user_data = {
                            'email': row['email'],
                            'full_name': row['full_name'],
                            'user_type': row.get('user_type', 'worker'),
                            'department': row.get('department', 'operations'),
                            'phone_number': row.get('phone_number', ''),
                            'employee_id': row.get('employee_id', ''),
                            'created_by': request.user
                        }
                        
                        user = User(**user_data)
                        # Set a temporary password
                        user.set_password(row.get('password', 'TempPass123!'))
                        user.force_password_change = True
                        user.save()
                        
                        created_users.append(user.email)
                        
                    except Exception as e:
                        errors.append(f"Row {row_num}: {str(e)}")
                
                # Log the import
                UserActivityLog.objects.create(
                    user=request.user,
                    action='users_imported',
                    description=f'Imported {len(created_users)} users from CSV',
                    metadata={'created_users': created_users, 'errors': errors}
                )
                
                return Response({
                    'success': f'Successfully imported {len(created_users)} users',
                    'created_users': created_users,
                    'errors': errors
                })
                
            except Exception as e:
                return Response({'error': f'Failed to process CSV file: {str(e)}'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing user preferences."""
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only the preferences for the current user or all for admins."""
        user = self.request.user
        if user.is_staff:
            return UserPreference.objects.all()
        return UserPreference.objects.filter(user=user)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_preferences(self, request):
        """Get current user's preferences"""
        preference, created = UserPreference.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(preference)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_preferences(self, request):
        """Update current user's preferences"""
        preference, created = UserPreference.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(preference, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['email'] = user.email
        token['full_name'] = user.full_name if hasattr(user, 'full_name') else ''
        token['user_type'] = user.user_type if hasattr(user, 'user_type') else ''
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user details to response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'full_name': self.user.full_name if hasattr(self.user, 'full_name') else '',
            'user_type': self.user.user_type if hasattr(self.user, 'user_type') else '',
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        print("Login attempt with data:", request.data)
        try:
            response = super().post(request, *args, **kwargs)
            print(f"User logged in successfully: {request.data.get('email')}")
            return response
        except Exception as e:
            print(f"Login failed: {str(e)}")
            raise


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            print(f"User {request.user.email} logged out successfully")
            return Response({"success": "Successfully logged out"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            print(f"Logout error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        print("Profile GET request received for user:", request.user.email)
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        print("Profile PATCH request received with data:", request.data)
        
        # Make a copy of the data to avoid modifying the request
        data = request.data.copy()
        
        # Remove empty avatar field to prevent validation errors
        if 'avatar' in data and not data['avatar']:
            data.pop('avatar')
        
        serializer = UserSerializer(request.user, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            print("Profile update validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing user sessions."""
    serializer_class = UserSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return sessions for current user or all for admins."""
        user = self.request.user
        if user.is_staff:
            return UserSession.objects.all().order_by('-last_activity')
        return UserSession.objects.filter(user=user).order_by('-last_activity')
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_sessions(self, request):
        """Get current user's active sessions"""
        sessions = UserSession.objects.filter(user=request.user, is_active=True)
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def terminate_session(self, request, pk=None):
        """Terminate a specific session"""
        session = self.get_object()
        
        # Users can only terminate their own sessions unless they're admin
        if not request.user.is_staff and session.user != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        session.is_active = False
        session.save()
        
        return Response({'success': 'Session terminated'})


class UserActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing user activity logs."""
    serializer_class = UserActivityLogSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Return activity logs with filtering options."""
        queryset = UserActivityLog.objects.select_related('user', 'affected_user').all()
        
        # Filter by user
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action
        action = self.request.query_params.get('action', None)
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            try:
                from datetime import datetime
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                queryset = queryset.filter(timestamp__gte=start_date)
            except ValueError:
                pass
        
        if end_date:
            try:
                from datetime import datetime
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                queryset = queryset.filter(timestamp__lte=end_date)
            except ValueError:
                pass
        
        return queryset.order_by('-timestamp')


class UserSecurityView(APIView):
    """View for managing user security settings"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id=None):
        """Get security settings for a user"""
        if user_id and request.user.is_staff:
            user = get_object_or_404(User, id=user_id)
        else:
            user = request.user
        
        serializer = UserSecuritySerializer(user)
        return Response(serializer.data)
    
    def patch(self, request, user_id=None):
        """Update security settings for a user"""
        if user_id and request.user.is_staff:
            user = get_object_or_404(User, id=user_id)
        else:
            user = request.user
        
        serializer = UserSecuritySerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Log security changes
            UserActivityLog.objects.create(
                user=request.user,
                action='security_updated',
                description='Security settings updated',
                affected_user=user,
                metadata=request.data
            )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Add at the end of the file
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['POST', 'PATCH', 'GET'])
@permission_classes([AllowAny])
def debug_request(request):
    """Debug view to help diagnose requests"""
    response_data = {
        'method': request.method,
        'path': request.path,
        'content_type': request.content_type,
        'data': request.data,
        'files': {k: v.name for k, v in request.FILES.items()},
        'headers': {k: v for k, v in request.headers.items() if k.lower().startswith('x-') or k.lower() in ['content-type', 'content-length', 'authorization']},
    }
    print("Debug request:", response_data)
    return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
def test_logout(request):
    """Test endpoint for logout functionality"""
    refresh_token = request.data.get('refresh')
    print(f"Test logout with token: {refresh_token}")
    
    try:
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"success": "Token blacklisted successfully"})
        else:
            return Response({"error": "No refresh token provided"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
