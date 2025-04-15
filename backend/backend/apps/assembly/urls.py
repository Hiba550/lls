from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssemblyProcessViewSet
from . import views

router = DefaultRouter()
router.register(r'assembly-process', AssemblyProcessViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('completed-assemblies/', views.create_completed_assembly, name='create_completed_assembly'),
    path('completed-assemblies/list/', views.get_completed_assemblies, name='get_completed_assemblies'),
    path('completed-assemblies/<str:assembly_id>/', views.get_assembly_details, name='get_assembly_details'),
    path('rework-order/', views.create_rework_order, name='create_rework_order'),
]