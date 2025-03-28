from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib import admin
from .views import WorkOrderViewSet, PCBTypeViewSet, test_connection, initialize_pcb_types

router = DefaultRouter()
router.register(r'work-order', WorkOrderViewSet)
router.register(r'pcb-types', PCBTypeViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('test-connection/', test_connection, name='test-connection'),
    path('initialize-pcb-types/', initialize_pcb_types, name='initialize-pcb-types'),
    path('', include(router.urls)),
]