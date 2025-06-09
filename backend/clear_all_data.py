import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.item_master.models import ItemMaster, PCBItem, BOMComponent, AssemblyProcess, AssemblyLog
from backend.apps.work_order.models import WorkOrder, PCBType
from backend.apps.notification_system.models import Notification

def clear_all_data():
    """Clear all data from the database"""
    print("Clearing all data from database...")
    
    # Clear in order to avoid foreign key constraints
    try:
        count = AssemblyLog.objects.all().delete()[0]
        print(f"Deleted {count} AssemblyLog records")
    except:
        print("No AssemblyLog records to delete")
    
    try:
        count = AssemblyProcess.objects.all().delete()[0]
        print(f"Deleted {count} AssemblyProcess records")
    except:
        print("No AssemblyProcess records to delete")
    
    try:
        count = BOMComponent.objects.all().delete()[0]
        print(f"Deleted {count} BOMComponent records")
    except:
        print("No BOMComponent records to delete")
    
    try:
        count = WorkOrder.objects.all().delete()[0]
        print(f"Deleted {count} WorkOrder records")
    except:
        print("No WorkOrder records to delete")
    
    try:
        count = PCBType.objects.all().delete()[0]
        print(f"Deleted {count} PCBType records")
    except:
        print("No PCBType records to delete")
    
    try:
        count = PCBItem.objects.all().delete()[0]
        print(f"Deleted {count} PCBItem records")
    except:
        print("No PCBItem records to delete")
    
    try:
        count = ItemMaster.objects.all().delete()[0]
        print(f"Deleted {count} ItemMaster records")
    except:
        print("No ItemMaster records to delete")
    
    try:
        count = Notification.objects.all().delete()[0]
        print(f"Deleted {count} Notification records")
    except:
        print("No Notification records to delete")
    
    print("\nDatabase cleared successfully!")

if __name__ == '__main__':
    clear_all_data()
