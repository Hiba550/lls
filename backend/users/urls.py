from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, 
    UserPreferenceViewSet, 
    CustomTokenObtainPairView, 
    LogoutView,
    UserProfileView,
    test_logout
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'preferences', UserPreferenceViewSet, basename='preference')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh_alt'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('users/profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('profile/change-password/', UserViewSet.as_view({'post': 'change_password'}), name='change-password'),
    path('preferences/', UserPreferenceViewSet.as_view({'get': 'my_preferences', 'patch': 'update_preferences'}), name='my-preferences'),
    path('auth/test-logout/', test_logout, name='test-logout'),
]