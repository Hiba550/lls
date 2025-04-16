from rest_framework import serializers
from .models import ItemMaster, AssemblyProcess, AssemblyLog, ScannedPart, BOMComponent, PCBItem

class ItemMasterSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = ItemMaster
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Convert image URL to absolute URL if image exists
        if representation.get('image'):
            request = self.context.get('request')
            if request:
                representation['image'] = request.build_absolute_uri(representation['image'])
        return representation

class PCBItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCBItem
        fields = '__all__'

class BOMComponentSerializer(serializers.ModelSerializer):
    child_item_details = ItemMasterSerializer(source='child_item', read_only=True)
    parent_item_details = ItemMasterSerializer(source='parent_item', read_only=True)
    
    class Meta:
        model = BOMComponent
        fields = '__all__'
        
    def validate(self, data):
        """
        Check that parent and child items are not the same
        """
        if data.get('parent_item') == data.get('child_item'):
            raise serializers.ValidationError("Parent and child items cannot be the same")
        return data

class ScannedPartSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScannedPart
        fields = '__all__'

class AssemblyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssemblyLog
        fields = '__all__'

class AssemblyProcessSerializer(serializers.ModelSerializer):
    scanned_parts = ScannedPartSerializer(many=True, read_only=True)
    logs = AssemblyLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = AssemblyProcess
        fields = '__all__'