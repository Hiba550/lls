from django.urls import path, include
from rest_framework.routers import DefaultRouter
from backend.apps.work_order.views import WorkOrderViewSet
from backend.apps.item_master.views import ItemMasterViewSet

# Create a router for the API
router = DefaultRouter()
router.register(r'work-order', WorkOrderViewSet)
router.register(r'item-master', ItemMasterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]