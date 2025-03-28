from django.contrib import admin
from .models import WorkOrder, PCBType

@admin.register(PCBType)
class PCBTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'prefix', 'active')
    search_fields = ('name', 'code', 'prefix')
    list_filter = ('active',)

@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ('product', 'item_code', 'pcb_type', 'quantity', 'machine_no', 'customer_name', 'target_date', 'status')
    search_fields = ('product', 'item_code', 'description')
    list_filter = ('pcb_type', 'status', 'machine_no', 'customer_name', 'target_date')
    autocomplete_fields = ('pcb_type',)