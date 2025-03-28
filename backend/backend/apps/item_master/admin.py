from django.contrib import admin
from .models import ItemMaster, BOMComponent

@admin.register(ItemMaster)
class ItemMasterAdmin(admin.ModelAdmin):
    list_display = ('item_code', 'description', 'type', 'uom', 'assembly', 'burn_test', 'packing')
    search_fields = ('item_code', 'description')
    list_filter = ('type', 'assembly', 'burn_test', 'packing')

@admin.register(BOMComponent)
class BOMComponentAdmin(admin.ModelAdmin):
    list_display = ('parent_item', 'child_item', 'quantity', 'case_no')
    search_fields = ('parent_item__item_code', 'child_item__item_code', 'case_no')
    list_filter = ('parent_item__type', 'child_item__type')