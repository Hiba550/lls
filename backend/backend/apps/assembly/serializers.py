from rest_framework import serializers
from .models import AssemblyProcess, AssemblyLog, ScannedPart

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