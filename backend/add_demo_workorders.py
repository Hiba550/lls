from django.utils import timezone
import os
import django

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

# Import models after Django is configured
from backend.apps.work_order.models import WorkOrder, PCBType
from datetime import date, timedelta

def create_demo_workorders():
    """Create demo work orders including the missing demo-2 order"""
    
    # Create demo-2 work order (with explicit ID)
    demo_2_exists = WorkOrder.objects.filter(id="demo-2").exists()
    
    if not demo_2_exists:
        # Try to get a PCB type, or create one if needed
        pcb_type, _ = PCBType.objects.get_or_create(
            code="YSB",
            defaults={
                "name": "Yarn Breaking System",
                "prefix": "5YB",
                "active": True
            }
        )
        
        # Create the demo-2 work order with explicit ID
        WorkOrder.objects.create(
            id="demo-2",  # Using string as ID
            product="YBS-2023-DEMO",
            item_code="5YB011999",
            pcb_type=pcb_type,
            description="Demo work order for YSB assembly",
            quantity=5,
            machine_no="YSB-TEST-01",
            customer_name="Demo Customer",
            target_date=date.today() + timedelta(days=14),
            released_by="System",
            status="Pending"
        )
        print("Created demo-2 work order")
    else:
        print("demo-2 work order already exists")

if __name__ == "__main__":
    create_demo_workorders()
    print("Demo work orders created successfully")
    print("Available work orders:", WorkOrder.objects.values_list('id', flat=True))