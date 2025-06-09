import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.work_order.models import PCBType
from backend.apps.item_master.models import PCBItem

# PCB items data to be loaded into PCBType model
pcb_types_data = [
    # YBS Types
    {"code": "5YB011056", "name": "YBS ILI DUCT ASSEMBLY - 24 spindles", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1610mm - RR", "prefix": "5YB"},
    {"code": "5YB011057", "name": "YBS ILI End DUCT ASSEMBLY - 25 spindles", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1680mm - RR", "prefix": "5YB"},
    {"code": "5YB011059", "name": "YBS ILI End DUCT ASSEMBLY - 23 spindle", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1750mm - RR", "prefix": "5YB"},
    {"code": "5YB011099", "name": "RAP - ILI DUCT ASSEMBLY - 23 spindles (PITCH-65 mm)", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1495mm (PITCH : 65 mm)", "prefix": "5YB"},
    {"code": "5YB011100", "name": "RAP - ILI DUCT ASSEMBLY - 24 spindles (PITCH-65 mm)", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1560mm (PITCH : 65 mm)", "prefix": "5YB"},
    {"code": "5YB011101", "name": "RAP - ILI DUCT ASSEMBLY - 25 spindles (PITCH-65 mm)", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1625mm (PITCH : 65 mm)", "prefix": "5YB"},
    {"code": "5YB011111", "name": "RAP ILI End DUCT ASSEMBLY - 23 spindle (PITCH- 75 mm)", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1725mm (PITCH : 75 mm)", "prefix": "5YB"},
    {"code": "5YB011112", "name": "RAP ILI End DUCT ASSEMBLY - 24 spindle (PITCH- 75 mm)", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1800mm (PITCH : 75 mm)", "prefix": "5YB"},
    {"code": "5YB011113", "name": "RAP ILI DUCT ASSEMBLY - 25 spindles (PITCH-75 mm)", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1875mm (PITCH : 75 mm)", "prefix": "5YB"},
    {"code": "5YB011446", "name": "YBS REGULAR ILI DUCT ASSEMBLY - 23 SPINDLES - V1", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1610mm (PITCH) - V2", "prefix": "5YB"},
    {"code": "5YB011447", "name": "YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1680mm (PITCH) - V2", "prefix": "5YB"},
    {"code": "5YB011448", "name": "YBS REGULAR ILI DUCT ASSEMBLY - 25 SPINDLES - V1", "description": "YBS POWER & COMMUNICATION CABLE ASSY - 1750mm - (75MM PITCH) - V2", "prefix": "5YB"},
    
    # RSM Types
    {"code": "5RS011075", "name": "1Master 3Slave 75 mm", "description": "RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)", "prefix": "5RS"},
    {"code": "5RS011076", "name": "3Slave 75 mm", "description": "RSM - POWER & COMMUNICATION CABLE ASSY without RMC- BL Ver- (75mm Pitch)", "prefix": "5RS"},
    {"code": "5RS011027", "name": "1M 6S 70 mm", "description": "RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- - RR", "prefix": "5RS"},
    {"code": "5RS011028", "name": "1M 3S 75 mm", "description": "RSM - POWER & COMMUNICATION CABLE ASSY with out RMC- BL Ver- - RR", "prefix": "5RS"},
    {"code": "5RS011111", "name": "1Master 3Slave 75 mm", "description": "RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)", "prefix": "5RS"},
    {"code": "5RS011112", "name": "3Slave 65 mm", "description": "RSM - POWER & COMMUNICATION CABLE ASSY without RMC- BL Ver- (75mm Pitch)", "prefix": "5RS"},
    {"code": "5RS011092", "name": "1M 3S V1", "description": "RSM - POWER & COMMUNICATION CABLE ASSY with RMC - (70MM PITCH) - V2", "prefix": "5RS"},
    {"code": "5RS011093", "name": "3S V1", "description": "RSM - POWER & COMMUNICATION CABLE ASSY without RMC - (70MM PITCH) - V2", "prefix": "5RS"},
]

print("🚀 Starting PCBType data import...")
print("=" * 60)

# First, let's also add the basic YBS and RSM categories
basic_types = [
    {"code": "YBS", "name": "YBS PCB Type", "description": "YBS (Yogi Bearing System) PCB assemblies", "prefix": "5YB"},
    {"code": "RSM", "name": "RSM PCB Type", "description": "RSM (Rotary System Module) PCB assemblies", "prefix": "5RS"},
]

created_count = 0
updated_count = 0

# Add basic types first
print("Adding basic PCB types...")
for type_data in basic_types:
    try:
        pcb_type, created = PCBType.objects.update_or_create(
            code=type_data["code"],
            defaults={
                'name': type_data["name"],
                'description': type_data["description"],
                'prefix': type_data["prefix"],
                'active': True
            }
        )
        
        if created:
            created_count += 1
            print(f"✅ Created basic type: {pcb_type.code} - {pcb_type.name}")
        else:
            updated_count += 1
            print(f"🔄 Updated basic type: {pcb_type.code} - {pcb_type.name}")
            
    except Exception as e:
        print(f"❌ Error processing basic type {type_data['code']}: {str(e)}")

# Add specific PCB types
print("\nAdding specific PCB types...")
for type_data in pcb_types_data:
    try:
        pcb_type, created = PCBType.objects.update_or_create(
            code=type_data["code"],
            defaults={
                'name': type_data["name"],
                'description': type_data["description"],
                'prefix': type_data["prefix"],
                'active': True
            }
        )
        
        if created:
            created_count += 1
            print(f"✅ Created: {pcb_type.code} - {pcb_type.name}")
        else:
            updated_count += 1
            print(f"🔄 Updated: {pcb_type.code} - {pcb_type.name}")
            
    except Exception as e:
        print(f"❌ Error processing {type_data['code']}: {str(e)}")

print("=" * 60)
print(f"📊 Import Summary:")
print(f"   Created: {created_count}")
print(f"   Updated: {updated_count}")
print(f"   Total processed: {len(basic_types) + len(pcb_types_data)}")

# List all PCB types
print(f"\n📋 All PCB types in database:")
all_types = PCBType.objects.all().order_by('prefix', 'code')
for pcb_type in all_types:
    status = "🟢" if pcb_type.active else "🔴"
    print(f"   {status} {pcb_type.code}: {pcb_type.name} (Prefix: {pcb_type.prefix})")

print(f"\nTotal PCB types in database: {all_types.count()}")

# Also load the same data into PCBItem model for consistency
print("\n" + "=" * 60)
print("🔄 Also loading data into PCBItem model for consistency...")

pcb_item_created = 0
pcb_item_updated = 0

for type_data in pcb_types_data:
    try:
        # Determine category from code
        category = 'YBS' if type_data["code"].startswith('5YB') else 'RSM'
        
        pcb_item, created = PCBItem.objects.update_or_create(
            item_code=type_data["code"],
            defaults={
                'name': type_data["name"],
                'cable_description': type_data["description"],
                'category': category,
                'is_active': True
            }
        )
        
        if created:
            pcb_item_created += 1
            print(f"✅ PCBItem created: {pcb_item.item_code} - {pcb_item.name}")
        else:
            pcb_item_updated += 1
            print(f"🔄 PCBItem updated: {pcb_item.item_code} - {pcb_item.name}")
            
    except Exception as e:
        print(f"❌ Error processing PCBItem {type_data['code']}: {str(e)}")

print("=" * 60)
print(f"📊 PCBItem Import Summary:")
print(f"   Created: {pcb_item_created}")
print(f"   Updated: {pcb_item_updated}")
print(f"   Total PCBItems in database: {PCBItem.objects.count()}")

print("\n🎉 All data loaded successfully!")
print("=" * 60)
