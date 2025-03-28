from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssemblyProcessViewSet

router = DefaultRouter()
router.register(r'assembly-process', AssemblyProcessViewSet)

urlpatterns = [
    path('', include(router.urls)),
]