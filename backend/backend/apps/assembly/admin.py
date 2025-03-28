from django.contrib import admin
from .models import AssemblyProcess, ScannedPart

@admin.register(AssemblyProcess)
class AssemblyProcessAdmin(admin.ModelAdmin):
    list_display = ('serial_number', 'work_order', 'status', 'created_by', 'started_at', 'completed_at')
    list_filter = ('status', 'created_by')
    search_fields = ('serial_number', 'work_order__item_code')

@admin.register(ScannedPart)
class ScannedPartAdmin(admin.ModelAdmin):
    list_display = ('part_code', 'assembly_process', 'scan_time', 'operator', 'replaced')
    list_filter = ('replaced', 'operator')
    search_fields = ('part_code', 'assembly_process__serial_number')
