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
    
    class Meta:
        model = WorkOrder
        fields = '__all__'
        
    def to_representation(self, instance):
        """Add a type field to make frontend filtering easier"""
        representation = super().to_representation(instance)
        
        # Add pcb_type_code for easier frontend filtering
        if instance.pcb_type:
            representation['pcb_type_code'] = instance.pcb_type.code
        elif instance.item_code:
            # Try to detect type from item code
            if instance.item_code.startswith('5YB'):
                representation['pcb_type_code'] = 'YSB'
            elif instance.item_code.startswith('5RS'):
                representation['pcb_type_code'] = 'RSM'
        
        return representation