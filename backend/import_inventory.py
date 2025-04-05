import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.item_master.models import ItemMaster

# Item data from the spreadsheet
item_data = """
SNo\tItem Type\tProduct\tItem Code\tDescription\tPart Type\tUom\tCode\tU_OperName\tAssembly\tBurn test\tPacking\tImage\tWeight\tRev Reason\tRev No\tCustomer Complaint Infromation
1\tPart\t\t409001297\tSAFETY (NYLOC) NUT M4 ZINC PLATED\t\tNos\t\t\t\t\tImage\t\t\t\t
2\tPart\t\t409037290\tWASHER M6\t\tNos\t\t\t\t\tImage\t\t\t\t
3\tPart\t\t409047250\tWASHER UR 10X4.3X0.8 ZINC PLATED (M4)\t\tNos\t\t\t\t\tImage\t\t\t\t
4\tPart\t\t409085400\tHEX SOC HEAD CAP SCREW S21 M6X16 BLACKENED\t\tNos\t\t\t\t\tImage\t\t\t\t
5\tPart\t\t4EC350401\tPVC CORRUGATED FLEXIBLE CONDUITS PIPE WO AL GREY 3/4 INCHES - (PART NO:YF170)\t\tNos\t\t\t\t\tImage\t\t\t\t
6\tPart\t\t4RS014009\tT – BOLTS M4 X L14\t\tNos\t\t\t\t\tImage\t\t\t\t
7\tPart\t\t4YB012052\tILI YBS - SPACER\t\tNos\t\t\t\t\tImage\t\t\t\t
8\tPart\t\t4YB012053\tILI YBS - END COVER\t\tNos\t\t\t\t\tImage\t\t\t\t
9\tPart\t\t4YB013257\tYBS ILI POWER SUPPLY TO FIRST DUCT 4-PIN CONNECTOR CABLE KIT - (70MM PITCH)\tYBS WHA\tNos\tU\t\t\t\tSerial\t\t\t\t
10\tPart\t\t4YB013270\tYBS Power Supply to First duct cable assembly -AX\tYBS WHA\tNos\tW\t\t\t\tY\t\t\t\t
11\tPart\t\t4YB013322\tYBS ILI POWER SUPPLY TO FIRST DUCT 4-PIN CONNECTOR CABLE KIT - AX PANEL - V2\tYBS WHA\tNos\t0W\t\t\t\t\t\t\t\t
12\tPart\t\t4YB013240\tASSEMBLED MACHINE INTERFACE ILI PCB - REV 1\tPCBA\tNos\tI\t\t\t\tY\t\t\t\t
13\tPart\t\t4YB013248\tASSEMBLED YBS ILI MASTER PCB - 24 SPINDLES -BL-T VER-REV 1\tPCBA\tNos\t8\t\t\t\tSerial\t\t\t\t
14\tPart\t\t4YB013249\tASSEMBLED YBS ILI MASTER PCB - 25 SPINDLES -BL-T VER-REV 1\tPCBA\tNos\t9\t\t\t\tSerial\t\t\t\t
15\tPart\t\t4YB013250\tASSEMBLED YBS ILI SLAVE LEFT PCB - BL VER - T - REV 1\tPCBA\tNos\tL\t\t\t\tSerial\t\t\t\t
16\tPart\t\t4YB013251\tASSEMBLED YBS ILI SLAVE RIGHT PCB - BL VER - T - REV 1\tPCBA\tNos\tR\t\t\t\tSerial\t\t\t\t
17\tPart\t\t4YB013271\tAssembled YBS ILI Slave Right PCB - BL Ver - T (65mm Pitch)\tPCBA\tNos\tS\t\t\t\tY\t\t\t\t
18\tBOM\t\t5YB013184\tCOMMUNICATION LINE FOR H/S LED DISPLAY FROM T/S PANEL\tIn HosueAssembly\tNos\t\t\t\t\tY\t\t\t\t
19\tPart\t\t4YB013321\tYBS ILI POWER SUPPLY TO FIRST DUCT 4-PIN CONNECTOR CABLE KIT - (70MM PITCH) - V2\tYBS WHA\tNos\t0U\t\t\t\t\t\t\t\t
20\tConsumable\t\t611300022\tYBS PACKING BOX COMPLETE - 1(LWH-3000mmx900mmx320mm)\t\tNos\t\t\t\t\tImage\t\t\t\t
21\tConsumable\t\t611YB0016\tTILT WATCH XTR AT 80 DEGRES - 24101\t\tNos\t\t\t\t\tImage\t\t\t\t
22\tConsumable\t\t611YB0017\tSHOCK WATCH  STICKERS - MPN - 25G 48000K SW2\t\tNos\t\t\t\t\tImage\t\t\t\t
23\tConsumable\t\t618100378\tPALLET - YBS PACKING BOX EXPORT HEAT TREATED WOOD 3030 X 980 X 140 MM (L X B X H)\t\tNos\t\t\t\t\tImage\t\t\t\t
24\tConsumable\t\t628800053\tCARTON BOX 540 X 300 X 510MM\t\tNos\t\t\t\t\tImage\t\t\t\t
25\tPart\t\t860YB6041\tRATCHET SPANNER 7MM - AEAF0607 - MAKE : JETECH TOOL\t\tNos\t\t\t\t\tImage\t\t\t\t
26\tPart\t\t4EC351045\tWE-AFB EMI SUPPRESSION AXIAL FERRITE BEAD 25HZ ID-18Ø, OD-28Ø, L-28.5(WURTH-74270095)\t\tNos\t\t\t\t\tImage\t\t\t\t
27\tPart\t\t4EC400015\tSINGLE CORE WIRE 1 SQMM YELLOW WITH GREEN (4510003)\t\tMts\t\t\t\t\tImage\t\t\t\t
28\tPart\t\t4EC600038\tROUND SOCKET 2.5 SQMM\t\tNos\t\t\t\t\tImage\t\t\t\t
29\tPart\t\t4YB013258\tBOARD TO BOARD PICOBLADE CABLE ASSY (SINGLE ROW 115MM, 14 CKTS) FOR ILI PCB ASSY\tWHA\tNos\tV\t\t\t\tSerial\t\t\t\t
30\tPart\t\t5YB013254\tRAP SENSOR HOUSING ASSEMBLY - 110MM - V2\tSensor\tNos\t1\t\t\t\tSerial\t\t\t\t
31\tPart\t\t5YB013255\tRAP SENSOR HOUSING ASSEMBLY - 200MM - V2\tSensor\tNos\t2\t\t\t\tSerial\t\t\t\t
32\tPart\t\t4RS013117\tRSM-POWER SUPPLY TO FIRST DUCT CABLE ASSY - BL VER - (70MM PITCH)\tRSM WHA\tNos\tA\t\t\t\tSerial\t\t\t\t
33\tPart\t\t4RS013122\tRSM - RMC CABLE ASSEMBLY -  MASTER TO LEFT  (10-10) - 200MM - BL VER - RR\tRSM WHA\tNos\tH\t\t\t\tSerial\t\t\t\t
34\tPart\t\t4RS013123\tRSM COMMUNICATION TERMINATION CABLE ASSY\tRSM WHA\tNos\tJ\t\t\t\tSerial\t\t\t\t
35\tBOM\t\t5YB011445\tCRITICAL SPARES FOR - ILI YBS REGULAR V1 (70MM PITCH)\tIn HosueAssembly\tNos\t\t\t\t\t\t\t\t\t
36\tPart\t\t4YB013305\tILI YBS LEFT SLAVE PCB ASSEMBLY - V2\tPCBA\tNos\t0L\t\t\t\t\t\t\t\t
37\tPart\t\t409030913\tHEX NUT 0.8D M5X0.8-ZINC PLATED-2ND\t\tNos\t\t\t\t\tImage\tSerial\t\t\t
38\tPart\t\t409047270\tWASHER UR 12X5.3X1.0 ZINC PLATED (M5)\t\tNos\t\t\t\t\tImage\tSerial\t\t\t
39\tPart\t\t409085420\tHEX SOCKET HEAD SCREW S21 M5X16 BLACKENED\t\tNos\t\t\t\t\tImage\tSerial\t\t\t
40\tPart\t\t449211041\tCABLE TIE CP100\t\tNos\t\t\t\t\tImage\tSerial\t\t\t
41\tPart\t\t4EC600056\tPVC STRIP CONNECTOR 6 AMPS\t\tNos\t\t\t\t\tImage\t\t\t\t
42\tPart\t\t4EC700195\tMULTI COLOR SINGLE STAGE TOWER LAMP 18-24VDC (GREEN ELECTRICAL : MPN - T61-NGNT2-M(RGB)-V1-C1\t\tMts\t\t\t\t\tImage\t\t\t\t
43\tPart\t\t4RS012010\tPVC CORRUGATED FLEXIBLE CONDUITS PIPE WO AL GREY 1 INCHES - (PART NO:YF230)\t\tNos\t\t\t\t\tImage\t\t\t\t
44\tPart\t\t5G0133370\tLAMP POST COMPLETE\t\tNos\t\t\t\t\tImage\t\t\t\t
45\tPart\t\t4YB013307\tILI YBS MASTER PCB ASSEMBLY - 24 SPINDLES - V2\tPCBA\tNos\t08\t\t\t\t\t\t\t\t
46\tPart\t\t4YB013308\tILI YBS MASTER PCB ASSEMBLY - 25 SPINDLES - V2\tPCBA\tNos\t09\t\t\t\t\t\t\t\t
47\tPart\t\t409030910\tHEX NUT 0.8D M5X0.8-ZINC PLATED\t\tNos\t\t\t\t\tImage\t\t\t\t
48\tPart\t\t409030990\tHEX NUT 0.8D M8X1.25-ZINC PLATED\t\tNos\t\t\t\t\tImage\t\t\t\t
49\tPart\t\t409047320\tWASHER UR 18X8.4X2.0 ZINC PLATED (M8)\t\tNos\t\t\t\t\tImage\t\t\t\t
50\tPart\t\t409085201\tHEX SOC HEAD CAP SCREW S21 M8X16 ZINC PLATED\t\tNos\t\t\t\t\tImage\t\t\t\t
51\tPart\t\t409085421\tHEX SOC HEAD CAP SCREW S21 M5X16 ZINC  PLATED\t\tNos\t\t\t\t\tImage\t\t\t\t
52\tPart\t\t4YB013306\tILI YBS RIGHT SLAVE PCB ASSEMBLY - V2\tPCBA\tNos\t0R\t\t\t\t\t\t\t\t
53\tPart\t\t5YB014155\tSTAND FOR YBS BREAKS DISPLAY LED SCREEN TYPE - 3\t\tNos\t\t\t\t\tImage\t\t\t\t
54\tPart\t\t409030953\tM4 HEX NUT ZINC PLATED\t\tNos\t\t\t\t\tImage\t\t\t\t
55\tPart\t\t409048080\tSPRING WASHER M4\t\tNos\t\t\t\t\tImage\t\t\t\t
56\tPart\t\t409085351\tHEX SOC HEAD CAP SCREW S21 M4X10 ZINC PLATED\t\tNos\t\t\t\t\tWeighable\t\t\t\t
57\tPart\t\t449211043\tCABLE TIE CP200\t\tNos\t\t\t\t\tImage\t\t\t\t
58\tPart\t\t4RS012007\tCLAMP – RSM\t\tNos\t\t\t\t\tImage\t\t\t\t
59\tBOM\t\t5YB011074\tLTS Panel Assembly\tIn HosueAssembly\tNos\t-\tPanel Assembly\tY\tN\tY\t\t\t\t
"""

# Continue with the rest of the items...
# Note: I truncated the data for brevity. You would include all items in your actual file.

def process_inventory_data(data_text):
    """Process tab-separated inventory data and return structured data"""
    items = []
    lines = data_text.strip().split('\n')
    
    # Skip the header
    header = lines[0].split('\t')
    
    # Process each line
    for i, line in enumerate(lines[1:], start=1):
        if not line.strip():
            continue
            
        fields = line.split('\t')
        
        if len(fields) < 7:  # Must have at least SNO, Type, Item Code, Description, UOM
            print(f"Line {i} has insufficient data: {line}")
            continue
            
        try:
            item_type = fields[1]
            
            # Only process Part items (BOM items are structures of parts, not inventory items)
            if item_type != 'Part' and item_type != 'Consumable':
                continue
                
            item_data = {
                'sno': int(fields[0]) if fields[0].strip() else i,
                'type': 'Part',  # Django model uses 'Part' for all components
                'product': fields[2] if len(fields) > 2 and fields[2].strip() else None,
                'item_code': fields[3],
                'description': fields[4],
                'uom': fields[6] if len(fields) > 6 and fields[6].strip() else 'Nos',
                'code': fields[7] if len(fields) > 7 and fields[7].strip() else None,
                'quantity': 0  # Initialize quantity as 0
            }
            
            items.append(item_data)
        except Exception as e:
            print(f"Error processing line {i}: {e}")
    
    return items

def import_inventory_to_db(items):
    """Import inventory items to the database"""
    created_count = 0
    updated_count = 0
    error_count = 0
    
    for item in items:
        try:
            # Check if item already exists by item_code
            item_code = item['item_code']
            
            try:
                existing_item = ItemMaster.objects.get(item_code=item_code)
                # If it exists, no need to update anything except ensuring quantity is 0
                existing_item.quantity = 0
                existing_item.save()
                print(f"Updated quantity for existing item: {item_code}")
                updated_count += 1
                
            except ItemMaster.DoesNotExist:
                # Create a new item
                ItemMaster.objects.create(
                    sno=item['sno'],
                    type=item['type'],
                    product=item['product'],
                    item_code=item['item_code'],
                    description=item['description'],
                    uom=item['uom'],
                    code=item['code'],
                    quantity=0  # Initialize with zero quantity
                )
                print(f"Created new item: {item_code}")
                created_count += 1
                
        except Exception as e:
            print(f"Error processing item {item.get('item_code', '')}: {str(e)}")
            error_count += 1
    
    return {
        'created': created_count,
        'updated': updated_count,
        'error_count': error_count,
        'total_processed': len(items)
    }

def clear_existing_inventory():
    """Clears all existing inventory items from the database"""
    try:
        count = ItemMaster.objects.all().delete()
        print(f"Cleared {count} existing inventory items.")
        return count
    except Exception as e:
        print(f"Error clearing inventory: {str(e)}")
        return None

def main():
    print("Starting Inventory Import Process...")
    
    # Process the inventory data
    items = process_inventory_data(item_data)
    print(f"Processed {len(items)} inventory items from data")
    
    # Clear existing inventory if requested
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        clear_existing_inventory()
    
    # Import the items
    result = import_inventory_to_db(items)
    
    print(f"Import completed:")
    print(f"  - Created: {result['created']} new items")
    print(f"  - Updated: {result['updated']} existing items")
    print(f"  - Errors: {result['error_count']}")
    print(f"  - Total processed: {result['total_processed']}")

if __name__ == "__main__":
    main()