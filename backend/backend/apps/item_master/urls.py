from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib import admin  # Import the admin module
from .views import ItemMasterViewSet, BOMComponentViewSet, PCBItemViewSet
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'item-master', ItemMasterViewSet)
router.register(r'bom-components', BOMComponentViewSet)
router.register(r'pcb-items', PCBItemViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend.apps.work_order.urls')),
    path('api/', include('backend.apps.item_master.urls')),
    path('api/', include('backend.apps.assembly.urls')),
    path('', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# In your api_root/urls.py or equivalent
urlpatterns = [
    path('work-order/', include('work_order.urls')),
    path('item-master/', include('item_master.urls')),
]

# In your work_order/urls.py
from .views import work_order_list_create, work_order_detail  # Import the missing views

urlpatterns = [
    path('work-order/', work_order_list_create, name='work-order-list-create'),
    path('work-order/<int:pk>/', work_order_detail, name='work-order-detail'),
]

# Similarly for item_master/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemMasterViewSet, AssemblyProcessViewSet, BOMComponentViewSet, PCBItemViewSet

# Create a router for the views specific to this app only
router = DefaultRouter()
router.register(r'item-master', ItemMasterViewSet)
router.register(r'assembly-process', AssemblyProcessViewSet)
router.register(r'bom-components', BOMComponentViewSet)
router.register(r'pcb-items', PCBItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]