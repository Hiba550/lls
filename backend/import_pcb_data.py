import os
import django
import re

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.item_master.models import PCBItem

# PCB data provided in the request
pcb_data = """
Item Code	Name	P&C Cable Description
YSB011056	YBS ILI DUCT ASSEMBLY - 24 spindles	YBS POWER & COMMUNICATION CABLE ASSY - 1610mm - RR
YSB011057	YBS ILI End DUCT ASSEMBLY - 25 spindles	YBS POWER & COMMUNICATION CABLE ASSY - 1680mm - RR
YSB011059	YBS ILI End DUCT ASSEMBLY - 23 spindle	YBS POWER & COMMUNICATION CABLE ASSY - 1750mm - RR


YSB011099	RAP - ILI DUCT ASSEMBLY - 23 spindles (PITCH-65 mm)	YBS POWER & COMMUNICATION CABLE ASSY - 1495mm (PITCH : 65 mm)
YSB011100	RAP - ILI DUCT ASSEMBLY - 24 spindles (PITCH-65 mm)	YBS POWER & COMMUNICATION CABLE ASSY - 1560mm (PITCH : 65 mm)
YSB011101	RAP - ILI DUCT ASSEMBLY - 25 spindles (PITCH-65 mm)	YBS POWER & COMMUNICATION CABLE ASSY - 1625mm (PITCH : 65 mm)


YSB011111	RAP ILI End DUCT ASSEMBLY - 23 spindle (PITCH- 75 mm)	YBS POWER & COMMUNICATION CABLE ASSY - 1725mm (PITCH : 75 mm)
YSB011112	RAP ILI End DUCT ASSEMBLY - 23 spindle (PITCH- 75 mm)	YBS POWER & COMMUNICATION CABLE ASSY - 1800mm (PITCH : 75 mm)
YSB011113	RAP ILI DUCT ASSEMBLY - 24 spindles (PITCH-75 mm)	YBS POWER & COMMUNICATION CABLE ASSY - 1875mm (PITCH : 75 mm)


YSB011446	YBS REGULAR ILI DUCT ASSEMBLY - 23 SPINDLES - V1	YBS POWER & COMMUNICATION CABLE ASSY - 1610mm (PITCH) - V2
YSB011447	YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1	YBS POWER & COMMUNICATION CABLE ASSY - 1680mm (PITCH) - V2
YSB011448	YBS REGULAR ILI DUCT ASSEMBLY - 25 SPINDLES - V1	YBS POWER & COMMUNICATION CABLE ASSY - 1750mm - (75MM PITCH) - V2



RSM011075	1Master 3Slave 75 mm	RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)
RSM011076	3Slave 75 mm	RSM - POWER & COMMUNICATION CABLE ASSY without RMC- BL Ver- (75mm Pitch)
RSM011027	1M 6S 70 mm	RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- - RR
RSM011028	1M 3S 75 mm	RSM - POWER & COMMUNICATION CABLE ASSY with out RMC- BL Ver- - RR
RSM011111	1Master 3Slave 75 mm	RSM - POWER & COMMUNICATION CABLE ASSY with RMC- BL Ver- (75mm Pitch)
RSM011112	3Slave 65 mm	RSM - POWER & COMMUNICATION CABLE ASSY without RMC- BL Ver- (75mm Pitch)
RSM011092	1M 3S V1	RSM - POWER & COMMUNICATION CABLE ASSY with RMC - (70MM PITCH) - V2
RSM011093	3S V1	RSM - POWER & COMMUNICATION CABLE ASSY without RMC - (70MM PITCH) - V2
"""

# Before processing, update item codes in the data
pcb_data = pcb_data.replace('YSB', 'YBS')

def extract_spindle_count(name):
    """Extract spindle count from name if present"""
    match = re.search(r'(\d+)\s*spindle', name, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

def extract_pitch(description):
    """Extract pitch from description if present"""
    match = re.search(r'(\d+)(?:\s*mm|\s*MM)\s*(?:PITCH|pitch)', description)
    if match:
        return f"{match.group(1)}mm"
    return None

def process_pcb_data(data_str):
    """Process the PCB data string and import into database"""
    # Split by lines and filter out empty lines
    lines = [line.strip() for line in data_str.strip().split('\n') if line.strip()]
    
    # Skip header line
    pcb_items = []
    header_found = False
    
    created_count = 0
    updated_count = 0
    
    for line in lines:
        # Skip empty lines and header
        if not line or line.startswith("Item Code") or "P&C Cable Description" in line:
            header_found = True
            continue
        
        # If line contains at least 2 tabs, it's likely a data row
        parts = line.split('\t')
        if len(parts) >= 3:
            item_code = parts[0].strip()
            name = parts[1].strip()
            cable_description = parts[2].strip()
            
            if item_code and name and cable_description:
                # Determine category based on item code
                category = 'YBS' if item_code.startswith('YSB') else 'RSM'
                
                # Extract spindle count and pitch if available
                spindle_count = extract_spindle_count(name)
                pitch = extract_pitch(name) or extract_pitch(cable_description)
                
                # Create or update PCB item
                try:
                    pcb_item, created = PCBItem.objects.update_or_create(
                        item_code=item_code,
                        defaults={
                            'name': name,
                            'cable_description': cable_description,
                            'category': category,
                            'spindle_count': spindle_count,
                            'pitch': pitch,
                            'is_active': True
                        }
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                    
                    pcb_items.append(pcb_item)
                except Exception as e:
                    print(f"Error processing item {item_code}: {str(e)}")
    
    return {
        'created': created_count,
        'updated': updated_count,
        'total': len(pcb_items),
        'items': pcb_items
    }

def main():
    print("Starting PCB data import...")
    result = process_pcb_data(pcb_data)
    print(f"Import completed. Created: {result['created']}, Updated: {result['updated']}, Total: {result['total']}")
    print("PCB items in the database:")
    for item in result['items']:
        print(f"- {item.item_code}: {item.name} ({item.category})")

if __name__ == '__main__':
    main()