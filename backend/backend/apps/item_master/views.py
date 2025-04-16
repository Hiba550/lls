from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from rest_framework.permissions import IsAdminUser, AllowAny
from .models import ItemMaster, AssemblyProcess, AssemblyLog, ScannedPart, BOMComponent, PCBItem
from .serializers import (
    ItemMasterSerializer, 
    AssemblyProcessSerializer, 
    AssemblyLogSerializer, 
    ScannedPartSerializer,
    BOMComponentSerializer,
    PCBItemSerializer
)
from .utils import import_item_master_data, import_bom_data

class PCBItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing PCB items with cable descriptions"""
    queryset = PCBItem.objects.all().order_by('item_code')
    serializer_class = PCBItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['item_code', 'name', 'cable_description']
    ordering_fields = ['item_code', 'category']
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @action(detail=False, methods=['GET'])
    def by_category(self, request):
        """Get PCB items grouped by category"""
        category = request.query_params.get('category')
        if category:
            queryset = self.queryset.filter(category=category.upper())
        else:
            queryset = self.queryset
            
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['POST'])
    def import_data(self, request):
        """
        Import PCB data from a structured format
        
        Expected format:
        {
            "items": [
                {
                    "item_code": "YSB011056",
                    "name": "YBS ILI DUCT ASSEMBLY - 24 spindles",
                    "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1610mm - RR",
                    ...
                },
                ...
            ]
        }
        """
        items = request.data.get('items', [])
        created = 0
        updated = 0
        
        for item_data in items:
            try:
                # Try to update existing item
                item = PCBItem.objects.get(item_code=item_data.get('item_code'))
                serializer = self.serializer_class(item, data=item_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    updated += 1
            except PCBItem.DoesNotExist:
                # Create new item
                serializer = self.serializer_class(data=item_data)
                if serializer.is_valid():
                    serializer.save()
                    created += 1
        
        return Response({
            'created': created,
            'updated': updated,
            'total': created + updated,
            'message': f"Successfully imported {created + updated} PCB items."
        })

class ItemMasterViewSet(viewsets.ModelViewSet):
    queryset = ItemMaster.objects.all()
    serializer_class = ItemMasterSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['item_code', 'description', 'product']
    ordering_fields = ['item_code', 'sno', 'product']
    permission_classes = [IsAdminUser]  # Only admin users can access
    
    @action(detail=False, methods=['GET'])
    def assembly_items(self, request):
        """Get items that require assembly"""
        queryset = self.queryset.filter(assembly=True)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['GET'])
    def bom(self, request, pk=None):
        """Get BOM components for an item"""
        item = self.get_object()
        if item.type == 'BOM':
            # Get all components for this BOM
            components = BOMComponent.objects.filter(parent_item=item)
            serializer = BOMComponentSerializer(components, many=True)
            return Response(serializer.data)
        return Response({"error": "Item is not a BOM"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['POST'])
    def add_component(self, request, pk=None):
        """Add a component to this BOM"""
        parent_item = self.get_object()
        if parent_item.type != 'BOM':
            return Response({"error": "Parent item is not a BOM"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = BOMComponentSerializer(data={
            'parent_item': parent_item.id,
            **request.data
        })
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['PUT', 'PATCH'])
    def update_item(self, request, pk=None):
        """
        Update an item master record
        """
        item = self.get_object()
        
        # Use PATCH for partial updates and PUT for complete replacement
        partial = request.method == 'PATCH'
        
        serializer = self.serializer_class(item, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['POST'])
    def import_data(self, request):
        """
        Import item master and BOM data
        
        Expected format:
        {
            "items": [
                {
                    "sno": 1,
                    "type": "Part",
                    "product": "Product name",
                    "item_code": "PART001",
                    "description": "Part description",
                    ...
                },
                ...
            ],
            "bom_components": [
                {
                    "parent_item_code": "BOM001", 
                    "child_item_code": "PART001",
                    "quantity": 2.0,
                    "case_no": "C1"
                },
                ...
            ]
        }
        """
        items = request.data.get('items', [])
        bom_components = request.data.get('bom_components', [])
        
        # First import all items
        item_result = import_item_master_data(items)
        
        # Then import BOM components which reference the items
        bom_result = import_bom_data(bom_components)
        
        return Response({
            'items': item_result,
            'bom_components': bom_result,
            'message': f"Successfully imported {item_result['total']} items and {bom_result['total']} BOM components."
        })

class BOMComponentViewSet(viewsets.ModelViewSet):
    queryset = BOMComponent.objects.all()
    serializer_class = BOMComponentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['parent_item__item_code', 'child_item__item_code', 'case_no']
    permission_classes = [IsAdminUser]  # Only admin users can access
    
    @action(detail=False, methods=['POST'])
    def add_multiple_components(self, request):
        """Add multiple child components to a parent item at once"""
        parent_item_id = request.data.get('parent_item')
        child_items = request.data.get('child_items', [])
        
        if not parent_item_id:
            return Response({"error": "parent_item is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not child_items or not isinstance(child_items, list):
            return Response({"error": "child_items must be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)
        
        created_components = []
        
        try:
            for child_item_data in child_items:
                child_item_id = child_item_data.get('child_item')
                quantity = child_item_data.get('quantity', 1)
                case_no = child_item_data.get('case_no', '')
                
                serializer = self.get_serializer(data={
                    'parent_item': parent_item_id,
                    'child_item': child_item_id,
                    'quantity': quantity,
                    'case_no': case_no
                })
                
                if serializer.is_valid():
                    component = serializer.save()
                    created_components.append(self.get_serializer(component).data)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(created_components, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AssemblyProcessViewSet(viewsets.ModelViewSet):
    queryset = AssemblyProcess.objects.all()
    serializer_class = AssemblyProcessSerializer
    permission_classes = [AllowAny]  # Allow any user to access this viewset
    authentication_classes = []  # No authentication required
    
    @action(detail=True, methods=['POST'])
    def add_scanned_part(self, request, pk=None):
        """Add a scanned part to the assembly process"""
        assembly_process = self.get_object()
        serializer = ScannedPartSerializer(data={
            'assembly_process': assembly_process.id,
            **request.data
        })
        
        if serializer.is_valid():
            serializer.save()
            
            # Create a log entry for this scan
            AssemblyLog.objects.create(
                assembly_process=assembly_process,
                action="Part Scanned",
                details=f"Part {request.data.get('part_code')} scanned successfully",
                operator=request.data.get('operator', 'Unknown')
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['POST'])
    def replace_part(self, request, pk=None):
        """Replace a previously scanned part"""
        try:
            part = ScannedPart.objects.get(id=request.data.get('part_id'))
            part.replaced = True
            part.replaced_with = request.data.get('replaced_with')
            part.replace_reason = request.data.get('replace_reason')
            part.replace_time = timezone.now()
            part.save()
            
            # Create a log entry for this replacement
            AssemblyLog.objects.create(
                assembly_process=part.assembly_process,
                action="Part Replaced",
                details=f"Part {part.part_code} replaced with {request.data.get('replaced_with')}. Reason: {request.data.get('replace_reason')}",
                operator=request.data.get('operator', 'Unknown')
            )
            
            return Response(ScannedPartSerializer(part).data)
        except ScannedPart.DoesNotExist:
            return Response({"error": "Part not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['POST'])
    def complete_assembly(self, request, pk=None):
        """Mark an assembly process as completed"""
        assembly_process = self.get_object()
        assembly_process.status = 'completed'
        assembly_process.completed_at = timezone.now()
        assembly_process.quantity_completed = request.data.get('quantity_completed', 1)
        assembly_process.notes = request.data.get('notes', '')
        assembly_process.save()
        
        # Create a log entry for completion
        AssemblyLog.objects.create(
            assembly_process=assembly_process,
            action="Assembly Completed",
            details=f"Assembly process completed with {assembly_process.quantity_completed} units",
            operator=request.data.get('operator', 'Unknown')
        )
        
        return Response(AssemblyProcessSerializer(assembly_process).data)