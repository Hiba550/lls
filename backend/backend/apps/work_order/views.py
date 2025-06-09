from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import WorkOrder, PCBType
from .serializers import WorkOrderSerializer, PCBTypeSerializer
import logging

# Set up logger
logger = logging.getLogger(__name__)

class PCBTypeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing PCB types (YBS, RSM)
    """
    queryset = PCBType.objects.all()
    serializer_class = PCBTypeSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'code', 'prefix']
    filterset_fields = ['active']
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None  # Disable pagination for this ViewSet


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
    pagination_class = None  # Disable pagination for this ViewSet
    
    def update(self, request, *args, **kwargs):
        """Custom update method to handle assembly completion and quantity updates"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Log the incoming update request
        logger.info(f"Updating work order {instance.id} with data: {request.data}")
        
        # Handle assembly completion logic
        if 'completed_quantity' in request.data:
            completed_quantity = request.data.get('completed_quantity')
            
            # Validate completed quantity
            if completed_quantity < 0:
                return Response(
                    {"error": "Completed quantity cannot be negative"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if completed_quantity > instance.quantity:
                return Response(
                    {"error": f"Completed quantity ({completed_quantity}) cannot exceed total quantity ({instance.quantity})"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update completed quantity
            instance.completed_quantity = completed_quantity
            
            # Auto-update status based on completion
            if completed_quantity >= instance.quantity:
                instance.status = 'Completed'
                logger.info(f"Work order {instance.id} marked as Completed")
            elif completed_quantity > 0:
                instance.status = 'In Progress'
                logger.info(f"Work order {instance.id} marked as In Progress")
        
        # Handle explicit status updates (normalize case)
        if 'status' in request.data:
            status_value = request.data.get('status')
            # Normalize status values from frontend
            status_mapping = {
                'completed': 'Completed',
                'in_progress': 'In Progress',
                'pending': 'Pending',
                'cancelled': 'Cancelled'
            }
            
            if status_value.lower() in status_mapping:
                instance.status = status_mapping[status_value.lower()]
                logger.info(f"Work order {instance.id} status updated to: {instance.status}")
            else:
                # Use the value as-is if it's already in the correct format
                instance.status = status_value
        
        # Handle other fields using the serializer
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            # Save using the serializer (which will call instance.save())
            serializer.save()
            
            logger.info(f"Work order {instance.id} updated successfully: {instance.completed_quantity}/{instance.quantity} completed, status: {instance.status}")
            
            return Response(serializer.data)
        else:
            logger.error(f"Validation errors for work order {instance.id}: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH requests"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def complete_unit(self, request, pk=None):
        """Complete one unit of the work order"""
        work_order = self.get_object()
        
        if work_order.complete_unit():
            logger.info(f"Unit completed for work order {work_order.id}: {work_order.completed_quantity}/{work_order.quantity}")
            serializer = self.get_serializer(work_order)
            return Response(serializer.data)
        else:
            return Response(
                {"error": "Cannot complete unit - all units already completed"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def create_rework(self, request, pk=None):
        """Create a rework order from a completed work order"""
        original_work_order = self.get_object()
        
        if original_work_order.status != 'Completed':
            return Response(
                {"error": "Can only create rework from completed work orders"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get rework quantity from request, default to 1
        rework_quantity = request.data.get('quantity', 1)
        rework_notes = request.data.get('notes', '')
        
        # Create rework order
        rework_order = WorkOrder.objects.create(
            product=original_work_order.product,
            item_code=original_work_order.item_code,
            pcb_type=original_work_order.pcb_type,
            description=f"REWORK: {original_work_order.description}",
            quantity=rework_quantity,
            completed_quantity=0,
            machine_no=original_work_order.machine_no,
            customer_name=original_work_order.customer_name,
            target_date=original_work_order.target_date,
            released_by=request.data.get('released_by', original_work_order.released_by),
            remarks=f"Rework order for WO #{original_work_order.id}. {rework_notes}",
            is_rework=True,
            original_work_order=original_work_order,
            rework_notes=rework_notes,
            priority='high',  # Rework orders are high priority
            status='Pending'
        )
        
        logger.info(f"Rework order {rework_order.id} created for original work order {original_work_order.id}")
        
        serializer = self.get_serializer(rework_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
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
        if pcb_type.lower() == 'ybs':
            queryset = self.queryset.filter(pcb_type__code='YBS') | self.queryset.filter(item_code__startswith='5YB')
        elif pcb_type.lower() == 'rsm':
            queryset = self.queryset.filter(pcb_type__code='RSM') | self.queryset.filter(item_code__startswith='5RS')
        else:
            queryset = self.queryset.filter(pcb_type__code=pcb_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def rework_orders(self, request):
        """Get all rework orders"""
        queryset = self.queryset.filter(is_rework=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_rework_from_completed(self, request):
        """Create a rework order from a completed assembly ID"""
        from ..assembly.models import CompletedAssembly
        
        completed_assembly_id = request.data.get('completed_assembly_id')
        reason = request.data.get('reason', 'Rework required')
        components = request.data.get('components', [])
        rework_notes = request.data.get('rework_notes', '')
        
        if not completed_assembly_id:
            return Response(
                {"error": "completed_assembly_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Find the completed assembly
            completed_assembly = CompletedAssembly.objects.get(id=completed_assembly_id)
            
            # Create rework work order
            rework_order = WorkOrder.objects.create(
                product=f"REWORK - {completed_assembly.product}",
                item_code=completed_assembly.item_code,
                description=f"Rework for {completed_assembly.item_code}: {reason}",
                quantity=1,
                completed_quantity=0,
                target_date=timezone.now().date(),
                released_by=request.data.get('released_by', 'REWORK_SYSTEM'),
                remarks=f"Rework for completed assembly {completed_assembly.id}. Reason: {reason}",
                is_rework=True,
                rework_notes=rework_notes,
                priority='high',
                status='Pending'
            )
            
            # Update the completed assembly to mark it as reworked
            completed_assembly.reworked = True
            completed_assembly.rework_notes = rework_notes
            completed_assembly.save()
            
            logger.info(f"Rework order {rework_order.id} created for completed assembly {completed_assembly.id}")
            
            serializer = self.get_serializer(rework_order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except CompletedAssembly.DoesNotExist:
            return Response(
                {"error": f"Completed assembly with ID {completed_assembly_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error creating rework order: {str(e)}")
            return Response(
                {"error": f"Failed to create rework order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def start_assembly(self, request, pk=None):
        """Start assembly process for a work order"""
        work_order = self.get_object()
        started_by = request.data.get('started_by', 'Unknown User')
        
        if work_order.start_assembly(started_by=started_by):
            logger.info(f"Assembly started for work order {work_order.id} by {started_by}")
            serializer = self.get_serializer(work_order)
            return Response(serializer.data)
        else:
            return Response(
                {"error": "Assembly already started"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def complete_assembly(self, request, pk=None):
        """Complete assembly with full tracking data"""
        work_order = self.get_object()
        
        # Extract data from request
        scanned_components = request.data.get('scanned_components', [])
        assembly_barcode = request.data.get('assembly_barcode')
        completed_by = request.data.get('completed_by', 'Unknown User')
        start_time = request.data.get('start_time')  # Can be ISO string
        quality_notes = request.data.get('quality_notes', '')
        
        # Parse start time if provided as string
        if start_time and isinstance(start_time, str):
            from django.utils.dateparse import parse_datetime
            start_time = parse_datetime(start_time)
        
        # Complete the assembly
        if work_order.complete_assembly(
            scanned_components=scanned_components,
            assembly_barcode=assembly_barcode,
            completed_by=completed_by,
            start_time=start_time
        ):
            # Add quality notes if provided
            if quality_notes:
                work_order.quality_notes = quality_notes
                work_order.save()
            
            logger.info(f"Assembly completed for work order {work_order.id} by {completed_by}")
            serializer = self.get_serializer(work_order)
            return Response(serializer.data)
        else:
            return Response(
                {"error": "Failed to complete assembly"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def scan_component(self, request, pk=None):
        """Add a scanned component to the work order"""
        work_order = self.get_object()
        
        component_barcode = request.data.get('component_barcode')
        sensor_id = request.data.get('sensor_id')
        scanned_by = request.data.get('scanned_by', 'Unknown User')
        
        if not component_barcode:
            return Response(
                {"error": "component_barcode is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if work_order.add_scanned_component(
            component_barcode=component_barcode,
            sensor_id=sensor_id,
            scanned_by=scanned_by
        ):
            logger.info(f"Component {component_barcode} scanned for work order {work_order.id}")
            serializer = self.get_serializer(work_order)
            return Response(serializer.data)
        else:
            return Response(
                {"error": "Failed to add scanned component"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['patch'])
    def update_assembly_data(self, request, pk=None):
        """Update assembly-specific data like barcodes and tracking info"""
        work_order = self.get_object()
        
        # Update allowed assembly fields
        assembly_fields = [
            'work_order_barcode', 'assembly_barcode', 'assembly_start_time',
            'assembly_duration_seconds', 'quality_notes', 'scanned_components',
            'component_scan_data'
        ]
        
        updated = False
        for field in assembly_fields:
            if field in request.data:
                setattr(work_order, field, request.data[field])
                updated = True
        
        if updated:
            work_order.save()
            logger.info(f"Assembly data updated for work order {work_order.id}")
        
        serializer = self.get_serializer(work_order)
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
    Initialize the database with default PCB types (YBS and RSM)
    """
    # Check if PCB types already exist
    if PCBType.objects.count() > 0:
        return Response({"message": "PCB types already initialized"})
    
    # Create default PCB types
    pcb_types = [
        {
            "code": "YBS",
            "name": "Yamaha System Board",
            "description": "YBS PCB for Yamaha keyboard and audio equipment",
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