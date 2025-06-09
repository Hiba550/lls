import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.item_master.models import PCBItem

print("Testing PCB item creation...")

try:
    # Test creating a simple PCB item
    test_item, created = PCBItem.objects.get_or_create(
        item_code="5YB000001",
        defaults={
            'name': "Test YBS Assembly",
            'cable_description': "Test cable description",
            'category': "YBS",
            'is_active': True
        }
    )

    if created:
        print(f"✅ Test PCB item created successfully: {test_item}")
    else:
        print(f"ℹ️ Test PCB item already exists: {test_item}")

    # List all PCB items
    print("\nAll PCB items in database:")
    pcb_items = PCBItem.objects.all()
    for item in pcb_items:
        print(f"- {item.item_code}: {item.name} ({item.category})")

    print(f"\nTotal PCB items: {pcb_items.count()}")
    
    # Also test if we can access the API data
    print("\n🔍 Testing database connection...")
    from django.db import connection
    cursor = connection.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%pcb%';")
    tables = cursor.fetchall()
    print(f"PCB-related tables: {tables}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
