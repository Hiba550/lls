from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.permissions import AllowAny
from .models import AssemblyProcess, ScannedPart, AssemblyLog, CompletedAssembly
from .serializers import AssemblyProcessSerializer, ScannedPartSerializer, AssemblyLogSerializer, CompletedAssemblySerializer
from ..work_order.models import WorkOrder

class AssemblyProcessViewSet(viewsets.ModelViewSet):
    queryset = AssemblyProcess.objects.all()
    serializer_class = AssemblyProcessSerializer
    permission_classes = [AllowAny]  # Allow any user to access this viewset
    authentication_classes = []      # No authentication required
    
    def create(self, request, *args, **kwargs):
        """Create a new assembly process"""
        # Ensure work_order is provided
        work_order_id = request.data.get('work_order')
        if not work_order_id:
            return Response(
                {"error": "work_order field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Get the work order
            work_order = WorkOrder.objects.get(id=work_order_id)
            
            # Generate serial number
            date = timezone.now()
            year = str(date.year)[2:]
            month = str(date.month).zfill(2)
            day = str(date.day).zfill(2)
            
            # Get completed count for this work order
            existing_assemblies = AssemblyProcess.objects.filter(work_order=work_order).count()
            sequential_number = str(existing_assemblies + 1).zfill(4)
            
            # Create serial number
            serial_number = f"5YB-{year}{month}{day}-{sequential_number}"
            
            # Create assembly process 
            assembly = AssemblyProcess.objects.create(
                work_order=work_order,
                item=work_order.item if hasattr(work_order, 'item') else None,
                serial_number=serial_number,
                status='pending',
                created_by=request.data.get('created_by', 'System'),
                current_sensor_index=1
            )
            
            # Log creation
            AssemblyLog.objects.create(
                assembly_process=assembly,
                action='Assembly Created',
                details=f"Assembly process with serial number {serial_number} created",
                operator=request.data.get('created_by', 'System')
            )
            
            serializer = self.get_serializer(assembly)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except WorkOrder.DoesNotExist:
            return Response(
                {"error": f"Work order with ID {work_order_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['POST'])
    def add_scanned_part(self, request, pk=None):
        """Add a scanned part to the assembly process"""
        assembly_process = self.get_object()
        
        if assembly_process.status not in ['pending', 'in_progress']:
            return Response(
                {"error": "Cannot add parts to a completed or rejected assembly"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set assembly to in_progress if it's pending
        if assembly_process.status == 'pending':
            assembly_process.status = 'in_progress'
            assembly_process.started_at = timezone.now()
            assembly_process.save()
        
        # Check if this sensor has already been scanned
        sensor_id = request.data.get('sensor_id')
        if sensor_id is not None and ScannedPart.objects.filter(assembly_process=assembly_process, sensor_id=sensor_id).exists():
            return Response(
                {"error": f"Sensor {sensor_id} has already been scanned"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the scanned part
        serializer = ScannedPartSerializer(data={
            **request.data,
            'assembly_process': assembly_process.id,
        })
        
        if serializer.is_valid():
            scanned_part = serializer.save()
            
            # Add a log entry
            AssemblyLog.objects.create(
                assembly_process=assembly_process,
                action='Part Scanned',
                details=f"Sensor {sensor_id}: Part {request.data.get('part_code')} scanned successfully",
                operator=request.data.get('operator', 'Unknown')
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['PATCH'])
    def update_sensor_index(self, request, pk=None):
        """Update the current sensor index"""
        assembly_process = self.get_object()
        
        if assembly_process.status not in ['pending', 'in_progress']:
            return Response(
                {"error": "Cannot update sensor index for a completed or rejected assembly"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        current_sensor_index = request.data.get('current_sensor_index')
        if current_sensor_index is not None:
            assembly_process.current_sensor_index = current_sensor_index
            assembly_process.save()
            
            return Response({
                "id": assembly_process.id,
                "current_sensor_index": assembly_process.current_sensor_index
            })
        
        return Response(
            {"error": "current_sensor_index is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['POST'])
    def complete(self, request, pk=None):
        """Complete an assembly process"""
        assembly_process = self.get_object()
        
        if assembly_process.status not in ['pending', 'in_progress']:
            return Response(
                {"error": "Cannot complete an assembly that is already completed or rejected"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notes = request.data.get('notes')
        operator = request.data.get('operator', 'Unknown')
        
        try:
            # Mark as completed
            assembly_process.status = 'completed'
            assembly_process.completed_at = timezone.now()
            assembly_process.quantity_completed = 1
            assembly_process.notes = notes
            assembly_process.save()
            
            # Add scanned parts if provided
            scanned_parts = request.data.get('scanned_parts', [])
            for part in scanned_parts:
                if not ScannedPart.objects.filter(
                    assembly_process=assembly_process, 
                    sensor_id=part.get('sensorId')
                ).exists():
                    ScannedPart.objects.create(
                        assembly_process=assembly_process,
                        part_code=part.get('part_code'),
                        sensor_id=part.get('sensorId'),
                        operator=part.get('operator', operator)
                    )
            
            # Update work order status if all units are complete
            work_order = assembly_process.work_order
            completed_assemblies = AssemblyProcess.objects.filter(
                work_order=work_order, 
                status='completed'
            ).count()
            
            if completed_assemblies >= work_order.quantity:
                work_order.status = 'Completed'
                work_order.save()
            elif work_order.status == 'Pending':
                work_order.status = 'In Progress'
                work_order.save()
            
            # Create next assembly if this is a multi-unit work order
            next_unit = None
            if completed_assemblies < work_order.quantity:
                # Generate next serial number
                date = timezone.now()
                year = str(date.year)[2:]
                month = str(date.month).zfill(2)
                day = str(date.day).zfill(2)
                sequential_number = str(completed_assemblies + 1).zfill(4)
                
                next_serial = f"5YB-{year}{month}{day}-{sequential_number}"
                
                next_unit = AssemblyProcess.objects.create(
                    work_order=work_order,
                    serial_number=next_serial,
                    status='pending',
                    created_by=operator
                )
            
            # Create a log entry
            AssemblyLog.objects.create(
                assembly_process=assembly_process,
                action='Assembly Completed',
                details=f"Assembly {assembly_process.serial_number} completed successfully",
                operator=operator
            )
            
            # Return the response
            response_data = self.get_serializer(assembly_process).data
            if next_unit:
                response_data['next_unit'] = {
                    'id': next_unit.id,
                    'serial_number': next_unit.serial_number
                }
            
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def update_metadata(self, request, pk=None):
        """Update metadata field for the assembly process"""
        try:
            assembly_process = self.get_object()
            metadata = request.data.get('metadata')
            
            if metadata is None:
                return Response(
                    {"error": "metadata field is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the metadata
            assembly_process.metadata = metadata
            assembly_process.save()
            
            return Response(
                self.get_serializer(assembly_process).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to update metadata: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['POST'])
def create_completed_assembly(request):
    """Create a new completed assembly record with proper component tracking"""
    try:
        # Extract component data from request
        components_data = request.data.get('scanned_components', [])
        
        # Make a copy of the request data to modify
        data = request.data.copy()
        
        # Ensure scanned_components is stored properly
        if components_data and isinstance(components_data, list):
            # The serializer will handle conversion to JSON
            data['scanned_components'] = components_data
        
        serializer = CompletedAssemblySerializer(data=data)
        if serializer.is_valid():
            assembly = serializer.save()
            
            # Return the created assembly with all component details
            return Response(CompletedAssemblySerializer(assembly).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_completed_assemblies(request):
    """Get all completed assemblies"""
    try:
        assemblies = CompletedAssembly.objects.all()
        serializer = CompletedAssemblySerializer(assemblies, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def create_rework_order(request):
    """Create a new rework order from an existing completed assembly"""
    try:
        # Validate required fields
        if not request.data.get('original_assembly_id'):
            return Response({'error': 'original_assembly_id is required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
            
        # Get the original completed assembly
        try:
            original_assembly = CompletedAssembly.objects.get(id=request.data.get('original_assembly_id'))
        except CompletedAssembly.DoesNotExist:
            return Response({'error': 'Original assembly not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create rework order data
        rework_data = {
            'product': request.data.get('product', f"{original_assembly.product} (REWORK)"),
            'item_code': request.data.get('item_code', original_assembly.item_code),
            'is_rework': True,
            'reworked': False,
            'original_assembly_id': original_assembly.id,
            'original_barcode': original_assembly.barcode_number or original_assembly.serial_number,
            'rework_notes': request.data.get('notes', 'Rework needed'),
            'status': 'pending',
            'created_by': request.data.get('created_by', 'System'),
        }
        
        # Add components to rework if specified
        if 'rework_components' in request.data and request.data['rework_components']:
            rework_data['rework_components'] = request.data['rework_components']
            
        # Create the rework order
        serializer = CompletedAssemblySerializer(data=rework_data)
        if serializer.is_valid():
            rework_order = serializer.save()
            
            # Log the rework order creation
            try:
                from ..work_order.models import WorkOrder
                
                # Create a work order entry for this rework
                work_order = WorkOrder.objects.create(
                    id=request.data.get('id', f"RW-{original_assembly.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"),
                    product=rework_data['product'],
                    item_code=rework_data['item_code'],
                    quantity=1,
                    status='Pending',
                    notes=f"Rework order for {original_assembly.id}",
                    created_at=timezone.now()
                )
                
                # Link the work order to the rework order
                rework_order.work_order_id = work_order.id
                rework_order.save()
            except Exception as e:
                # Continue even if work order creation fails
                pass
            
            return Response(CompletedAssemblySerializer(rework_order).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_assembly_details(request, assembly_id):
    """Get detailed information about an assembly including all component barcodes"""
    try:
        assembly = CompletedAssembly.objects.get(id=assembly_id)
        serializer = CompletedAssemblySerializer(assembly)
        
        # Process the data to ensure component barcodes are included
        data = serializer.data
        
        # Make sure scanned_components field is properly populated
        if hasattr(assembly, 'scanned_components'):
            data['scanned_components'] = assembly.scanned_components
            
        # Include list of component barcodes
        component_barcodes = []
        if data.get('scanned_components'):
            for component in data['scanned_components']:
                if 'barcode' in component:
                    component_barcodes.append(component['barcode'])
        
        data['component_barcodes'] = component_barcodes
        
        return Response(data)
    except CompletedAssembly.DoesNotExist:
        return Response({'error': 'Assembly not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
