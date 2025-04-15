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

from .models import UserPreference
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserPreferenceSerializer,
    LoginSerializer,
    PasswordChangeSerializer
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
        if self.action in ['create', 'list']:
            permission_classes = [IsAdminUser]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            permission_classes = [IsAdminOrSelf]
        elif self.action == 'destroy':
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
        
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
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


# Add debug code to UserProfileView
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
