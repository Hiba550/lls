from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import AllowAny
from .models import WorkOrder, PCBType
from .serializers import WorkOrderSerializer, PCBTypeSerializer
import logging

# Set up logger
logger = logging.getLogger(__name__)

class PCBTypeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing PCB types (YSB, RSM)
    """
    queryset = PCBType.objects.all()
    serializer_class = PCBTypeSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'code', 'prefix']
    filterset_fields = ['active']
    permission_classes = [AllowAny]
    authentication_classes = []


class WorkOrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing work orders
    """
    queryset = WorkOrder.objects.all().order_by('-created_at')
    serializer_class = WorkOrderSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['product', 'item_code', 'description', 'customer_name']
    filterset_fields = ['status', 'pcb_type']
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def create(self, request, *args, **kwargs):
        """Create a new work order"""
        # Log the incoming request data for debugging
        logger.info(f"Creating work order with data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            work_order = serializer.save()
            
            # Return the created work order data
            return Response(
                self.get_serializer(work_order).data,
                status=status.HTTP_201_CREATED
            )
        
        # Log validation errors for debugging
        logger.error(f"Validation errors: {serializer.errors}")
        
        # Return detailed error response
        return Response({
            "errors": serializer.errors,
            "required_fields": ["product", "item_code", "description", "quantity", "target_date", "released_by"],
            "message": "Please check that all required fields are provided and valid"
        }, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, methods=['get'])
    def by_pcb_type(self, request):
        """Filter work orders by PCB type code"""
        pcb_type = request.query_params.get('type')
        if not pcb_type:
            return Response(
                {"error": "PCB type parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find work orders with matching PCB type code or item code prefix
        if pcb_type.lower() == 'ysb':
            queryset = self.queryset.filter(pcb_type__code='YSB') | self.queryset.filter(item_code__startswith='5YB')
        elif pcb_type.lower() == 'rsm':
            queryset = self.queryset.filter(pcb_type__code='RSM') | self.queryset.filter(item_code__startswith='5RS')
        else:
            queryset = self.queryset.filter(pcb_type__code=pcb_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@api_view(['GET'])
def test_connection(request):
    """
    Simple test endpoint to verify API connectivity
    """
    return Response({
        "status": "success", 
        "message": "API is working correctly!",
        "service": "Work Order API"
    })


@api_view(['POST'])
def initialize_pcb_types(request):
    """
    Initialize the database with default PCB types (YSB and RSM)
    """
    # Check if PCB types already exist
    if PCBType.objects.count() > 0:
        return Response({"message": "PCB types already initialized"})
    
    # Create default PCB types
    pcb_types = [
        {
            "code": "YSB",
            "name": "Yamaha System Board",
            "description": "YSB PCB for Yamaha keyboard and audio equipment",
            "prefix": "5YB",
            "active": True
        },
        {
            "code": "RSM",
            "name": "Roland Sound Module",
            "description": "RSM PCB for Roland sound modules and synthesizers",
            "prefix": "5RS",
            "active": True
        }
    ]
    
    created = []
    for pcb_type_data in pcb_types:
        serializer = PCBTypeSerializer(data=pcb_type_data)
        if serializer.is_valid():
            pcb_type = serializer.save()
            created.append(pcb_type.code)
    
    return Response({
        "status": "success",
        "message": f"PCB types initialized: {', '.join(created)}"
    })