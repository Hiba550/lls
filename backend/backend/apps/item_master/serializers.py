from rest_framework import serializers
from .models import ItemMaster, AssemblyProcess, AssemblyLog, ScannedPart, BOMComponent, PCBItem

class ItemMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemMaster
        fields = '__all__'

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