from rest_framework import serializers
from .models import WorkOrder, PCBType

class PCBTypeSerializer(serializers.ModelSerializer):
    """Serializer for PCBType model"""
    
    class Meta:
        model = PCBType
        fields = ('id', 'code', 'name', 'description', 'prefix', 'active')


class WorkOrderSerializer(serializers.ModelSerializer):
    """Serializer for WorkOrder model"""
    pcb_type_detail = PCBTypeSerializer(source='pcb_type', read_only=True)
    original_work_order_detail = serializers.SerializerMethodField()
    rework_id = serializers.ReadOnlyField()
    rework_count = serializers.SerializerMethodField()
    display_id = serializers.ReadOnlyField()
    remaining_quantity = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    is_fully_completed = serializers.ReadOnlyField()
    component_count = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkOrder
        fields = '__all__'
    
    def get_original_work_order_detail(self, obj):
        """Get original work order details for rework orders"""
        if obj.original_work_order:
            return {
                'id': obj.original_work_order.id,
                'item_code': obj.original_work_order.item_code,
                'product': obj.original_work_order.product
            }
        return None
    
    def get_rework_count(self, obj):
        """Get count of rework orders for this work order"""
        return obj.rework_orders.count()
    
    def get_component_count(self, obj):
        """Get count of scanned components"""
        if obj.scanned_components:
            return len(obj.scanned_components)
        return 0
        
    def to_representation(self, instance):
        """Add a type field to make frontend filtering easier"""
        representation = super().to_representation(instance)
        
        # Add pcb_type_code for easier frontend filtering
        if instance.pcb_type:
            representation['pcb_type_code'] = instance.pcb_type.code
        elif instance.item_code:
            # Try to detect type from item code
            if instance.item_code.startswith('5YB'):
                representation['pcb_type_code'] = 'YBS'
            elif instance.item_code.startswith('5RS'):
                representation['pcb_type_code'] = 'RSM'
        
        # Add display-friendly ID for rework orders
        if instance.is_rework:
            representation['display_id'] = f"RW-{instance.id:06d}"
        else:
            representation['display_id'] = instance.item_code
            
        return representation