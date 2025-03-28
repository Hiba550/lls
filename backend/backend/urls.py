from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from backend.apps.assembly.views import AssemblyProcessViewSet
from backend.apps.work_order.views import WorkOrderViewSet
from backend.apps.item_master.views import ItemMasterViewSet, PCBItemViewSet
from django.shortcuts import render
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Setup the router
router = routers.DefaultRouter()
router.register(r'assembly-process', AssemblyProcessViewSet)
router.register(r'work-order', WorkOrderViewSet)
router.register(r'item-master', ItemMasterViewSet)
router.register(r'pcb-items', PCBItemViewSet)

# Define a view for the root URL using the template
def landing_page(request):
    return render(request, 'landing_page.html')

# Schema view for documentation using drf-yasg
schema_view = get_schema_view(
    openapi.Info(
        title="Production & QA API",
        default_version='v1',
        description="API for managing production and quality assurance processes",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('', landing_page, name='landing_page'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/', include('backend.apps.assembly.urls')),
    path('api/', include('backend.apps.work_order.urls')),
    path('api-auth/', include('rest_framework.urls')),
    
    # drf-yasg API documentation endpoints
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^docs/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] 

# Add media and static file serving for development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)