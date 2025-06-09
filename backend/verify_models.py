#!/usr/bin/env python
import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    import django
    django.setup()
    print("✅ Django setup successful")
    
    # Import models
    from backend.apps.work_order.models import PCBType
    from backend.apps.item_master.models import PCBItem
    print("✅ Models imported successfully")
    
    # Test database access
    from django.db import connection
    cursor = connection.cursor()
    
    # Check PCBType table
    try:
        pcb_types_count = PCBType.objects.count()
        print(f"📊 PCBType model: {pcb_types_count} records")
        
        # Add a simple test PCB type
        test_type, created = PCBType.objects.get_or_create(
            code="TEST_YBS",
            defaults={
                'name': 'Test YBS Type',
                'description': 'Test PCB type for verification',
                'prefix': '5YB',
                'active': True
            }
        )
        if created:
            print(f"✅ Test PCBType created: {test_type}")
        else:
            print(f"ℹ️ Test PCBType already exists: {test_type}")
            
    except Exception as e:
        print(f"❌ PCBType error: {e}")
    
    # Check PCBItem table
    try:
        pcb_items_count = PCBItem.objects.count()
        print(f"📊 PCBItem model: {pcb_items_count} records")
        
        # Add a simple test PCB item
        test_item, created = PCBItem.objects.get_or_create(
            item_code="TEST_5YB001",
            defaults={
                'name': 'Test YBS Item',
                'cable_description': 'Test cable description',
                'category': 'YBS',
                'is_active': True
            }
        )
        if created:
            print(f"✅ Test PCBItem created: {test_item}")
        else:
            print(f"ℹ️ Test PCBItem already exists: {test_item}")
            
    except Exception as e:
        print(f"❌ PCBItem error: {e}")
    
    print("\n🎯 Database verification completed successfully!")

except Exception as e:
    print(f"❌ Critical error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
