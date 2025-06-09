import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.work_order.models import PCBType, WorkOrder
from backend.apps.item_master.models import ItemMaster, PCBItem, BOMComponent, AssemblyProcess, AssemblyLog, ScannedPart

def clear_all_data():
    """Clear all item master and work order data"""
    print("Clearing all existing data...")
    
    # Clear work orders first (due to foreign key constraints)
    work_order_count = WorkOrder.objects.count()
    WorkOrder.objects.all().delete()
    print(f"Deleted {work_order_count} work orders")
    
    # Clear PCB types
    pcb_type_count = PCBType.objects.count()
    PCBType.objects.all().delete()
    print(f"Deleted {pcb_type_count} PCB types")
    
    # Clear assembly related data
    assembly_log_count = AssemblyLog.objects.count()
    AssemblyLog.objects.all().delete()
    print(f"Deleted {assembly_log_count} assembly logs")
    
    scanned_part_count = ScannedPart.objects.count()
    ScannedPart.objects.all().delete()
    print(f"Deleted {scanned_part_count} scanned parts")
    
    assembly_process_count = AssemblyProcess.objects.count()
    AssemblyProcess.objects.all().delete()
    print(f"Deleted {assembly_process_count} assembly processes")
    
    # Clear BOM components
    bom_count = BOMComponent.objects.count()
    BOMComponent.objects.all().delete()
    print(f"Deleted {bom_count} BOM components")
    
    # Clear PCB items
    pcb_item_count = PCBItem.objects.count()
    PCBItem.objects.all().delete()
    print(f"Deleted {pcb_item_count} PCB items")
    
    # Clear item master
    item_master_count = ItemMaster.objects.count()
    ItemMaster.objects.all().delete()
    print(f"Deleted {item_master_count} item master records")
    
    print("\nAll data cleared successfully!")

if __name__ == '__main__':
    clear_all_data()
