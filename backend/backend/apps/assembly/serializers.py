from rest_framework import serializers
from .models import AssemblyProcess, AssemblyLog, ScannedPart, CompletedAssembly

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

class CompletedAssemblySerializer(serializers.ModelSerializer):
    scanned_components = serializers.JSONField(required=False)
    rework_components = serializers.JSONField(required=False)
    
    class Meta:
        model = CompletedAssembly
        fields = '__all__'