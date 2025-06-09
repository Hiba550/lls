import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.item_master.models import PCBItem

# Simple PCB data list
pcb_items_data = [
    {"item_code": "5YB011056", "name": "YBS ILI DUCT ASSEMBLY - 24 spindles", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1610mm - RR", "category": "YBS"},
    {"item_code": "5YB011057", "name": "YBS ILI End DUCT ASSEMBLY - 25 spindles", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1680mm - RR", "category": "YBS"},
    {"item_code": "5YB011059", "name": "YBS ILI End DUCT ASSEMBLY - 23 spindle", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1750mm - RR", "category": "YBS"},
    {"item_code": "5YB011099", "name": "RAP - ILI DUCT ASSEMBLY - 23 spindles (PITCH-65 mm)", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1495mm (PITCH : 65 mm)", "category": "YBS"},
    {"item_code": "5YB011100", "name": "RAP - ILI DUCT ASSEMBLY - 24 spindles (PITCH-65 mm)", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1560mm (PITCH : 65 mm)", "category": "YBS"},
    {"item_code": "5YB011101", "name": "RAP - ILI DUCT ASSEMBLY - 25 spindles (PITCH-65 mm)", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1625mm (PITCH : 65 mm)", "category": "YBS"},
    {"item_code": "5YB011111", "name": "RAP ILI End DUCT ASSEMBLY - 23 spindle (PITCH- 75 mm)", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1725mm (PITCH : 75 mm)", "category": "YBS"},
    {"item_code": "5YB011112", "name": "RAP ILI End DUCT ASSEMBLY - 24 spindle (PITCH- 75 mm)", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1800mm (PITCH : 75 mm)", "category": "YBS"},
    {"item_code": "5YB011113", "name": "RAP ILI DUCT ASSEMBLY - 25 spindles (PITCH-75 mm)", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1875mm (PITCH : 75 mm)", "category": "YBS"},
    {"item_code": "5YB011446", "name": "YBS REGULAR ILI DUCT ASSEMBLY - 23 SPINDLES - V1", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1610mm (PITCH) - V2", "category": "YBS"},
    {"item_code": "5YB011447", "name": "YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1680mm (PITCH) - V2", "category": "YBS"},
    {"item_code": "5YB011448", "name": "YBS REGULAR ILI DUCT ASSEMBLY - 25 SPINDLES - V1", "cable_description": "YBS POWER & COMMUNICATION CABLE ASSY - 1750mm - (75MM PITCH) - V2", "category": "YBS"},
    {"item_code": "5RS011075", "name": "1Master 3Slave 75 mm", "cable_description": "RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)", "category": "RSM"},
    {"item_code": "5RS011076", "name": "3Slave 75 mm", "cable_description": "RSM - POWER & COMMUNICATION CABLE ASSY without RMC- BL Ver- (75mm Pitch)", "category": "RSM"},
    {"item_code": "5RS011027", "name": "1M 6S 70 mm", "cable_description": "RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- - RR", "category": "RSM"},
    {"item_code": "5RS011028", "name": "1M 3S 75 mm", "cable_description": "RSM - POWER & COMMUNICATION CABLE ASSY with out RMC- BL Ver- - RR", "category": "RSM"},
    {"item_code": "5RS011111", "name": "1Master 3Slave 75 mm", "cable_description": "RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)", "category": "RSM"},
    {"item_code": "5RS011112", "name": "3Slave 65 mm", "cable_description": "RSM - POWER & COMMUNICATION CABLE ASSY without RMC- BL Ver- (75mm Pitch)", "category": "RSM"},
    {"item_code": "5RS011092", "name": "1M 3S V1", "cable_description": "RSM - POWER & COMMUNICATION CABLE ASSY with RMC - (70MM PITCH) - V2", "category": "RSM"},
    {"item_code": "5RS011093", "name": "3S V1", "cable_description": "RSM - POWER & COMMUNICATION CABLE ASSY without RMC - (70MM PITCH) - V2", "category": "RSM"},
]

print("Starting PCB data import...")

created_count = 0
updated_count = 0

for item_data in pcb_items_data:
    try:
        pcb_item, created = PCBItem.objects.update_or_create(
            item_code=item_data["item_code"],
            defaults={
                'name': item_data["name"],
                'cable_description': item_data["cable_description"],
                'category': item_data["category"],
                'is_active': True
            }
        )
        
        if created:
            created_count += 1
            print(f"✅ Created: {pcb_item.item_code} - {pcb_item.name}")
        else:
            updated_count += 1
            print(f"🔄 Updated: {pcb_item.item_code} - {pcb_item.name}")
            
    except Exception as e:
        print(f"❌ Error processing {item_data['item_code']}: {str(e)}")

print(f"\n📊 Import Summary:")
print(f"   Created: {created_count}")
print(f"   Updated: {updated_count}")
print(f"   Total processed: {len(pcb_items_data)}")

# List all PCB items
print(f"\n📋 All PCB items in database:")
all_items = PCBItem.objects.all().order_by('category', 'item_code')
for item in all_items:
    print(f"   {item.item_code}: {item.name} ({item.category})")

print(f"\nTotal PCB items in database: {all_items.count()}")
