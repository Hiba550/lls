from django.utils import timezone
from .models import ItemMaster, BOMComponent
from ..work_order.models import WorkOrder
import datetime

def create_sample_ysb_data():
    """Create sample YSB data in the database"""
    
    # Define all YBS machine types
    ysb_machines = [
        {
            'item_code': '5YB011056',
            'product': 'YBS ILI Duct Assembly - 24 spindles',
            'description': 'YBS ILI DUCT ASSEMBLY - 24 spindles (PITCH - 65 mm)',
            'sno': 1056
        },
        {
            'item_code': '5YB011057',
            'product': 'YBS ILI Duct Assembly - 24 spindles',
            'description': 'YBS ILI DUCT ASSEMBLY - 24 spindles (PITCH - 65 mm)',
            'sno': 1057
        },
        {
            'item_code': '5YB011059',
            'product': 'YBS ILI End Duct Assembly - 25 spindles',
            'description': 'YBS ILI End DUCT ASSEMBLY - 25 spindles',
            'sno': 1059
        },
        {
            'item_code': '5YB011099',
            'product': 'RAP - ILI Duct Assembly - 23 spindles (PITCH-65 mm)',
            'description': 'RAP - ILI DUCT ASSEMBLY - 23 spindles (PITCH 65 mm)',
            'sno': 1099
        },
        {
            'item_code': '5YB011100',
            'product': 'RAP - ILI Duct Assembly - 24 spindles (PITCH-65 mm)',
            'description': 'RAP - ILI DUCT ASSEMBLY - 24 spindles (PITCH 65 mm)',
            'sno': 1100
        },
        {
            'item_code': '5YB011101',
            'product': 'RAP - ILI Duct Assembly - 25 spindles (PITCH-65 mm)',
            'description': 'RAP - ILI DUCT ASSEMBLY - 25 spindles (PITCH 65 mm)',
            'sno': 1101
        },
        {
            'item_code': '5YB011111',
            'product': 'RAP ILI End Duct Assembly - 23 spindle (PITCH-75 mm)',
            'description': 'RAP ILI End DUCT ASSEMBLY - 23 spindle (PITCH-75 mm)',
            'sno': 1111
        },
        {
            'item_code': '5YB011112',
            'product': 'RAP ILI End Duct Assembly - 24 spindles (PITCH-75 mm)',
            'description': 'RAP ILI End DUCT ASSEMBLY - 24 spindles (PITCH-75 mm)',
            'sno': 1112
        },
        {
            'item_code': '5YB011113',
            'product': 'RAP ILI End Duct Assembly - 25 spindles (PITCH-75 mm)',
            'description': 'RAP ILI End DUCT ASSEMBLY - 25 spindles (PITCH-75 mm)',
            'sno': 1113
        }
    ]
    
    # Create all YBS machine types
    for machine in ysb_machines:
        cable_assy, created = ItemMaster.objects.get_or_create(
            item_code=machine['item_code'],
            defaults={
                'sno': machine['sno'],
                'type': 'BOM',
                'product': machine['product'],
                'description': machine['description'],
                'uom': 'EA',
                'assembly': True,
                'burn_test': True,
                'packing': True,
                'rev_no': 1
            }
        )
        
        if created:
            print(f"Created {cable_assy.item_code} - {cable_assy.description}")
        else:
            print(f"{cable_assy.item_code} already exists")
    
    # Create a sample work order for the YBS assembly
    today = timezone.now().date()
    target_date = today + datetime.timedelta(days=14)
    
    work_order, created = WorkOrder.objects.get_or_create(
        item_code='5YB011057',
        defaults={
            'product': 'YBS POWER & COMMUNICATION CABLE ASSY -1680mm - RR',
            'description': 'YBS POWER & COMMUNICATION CABLE ASSY -1680mm - RR',
            'quantity': 5,
            'target_date': target_date,
            'customer_name': 'YBS Systems Inc.',
            'machine_no': 'M-YBS-001',
            'released_by': 'System',
            'remarks': 'Sample YBS Cable Assembly Work Order',
            'status': 'Pending'
        }
    )
    
    if created:
        print(f"Created work order for {work_order.item_code}")
    else:
        print(f"Work order for {work_order.item_code} already exists")
    
    return "Sample YSB data created successfully with all 9 machine types"

def import_item_master_data(item_data_list):
    """
    Import a list of item master data.
    
    Expected format for each item:
    {
        'sno': 123,
        'type': 'Part' or 'BOM',
        'product': 'Product name',
        'item_code': 'ABC123',
        'description': 'Item description',
        'uom': 'EA',
        ...other ItemMaster fields...
    }
    """
    created_count = 0
    updated_count = 0
    
    for item in item_data_list:
        obj, created = ItemMaster.objects.update_or_create(
            item_code=item['item_code'],
            defaults={
                'sno': item.get('sno', 0),
                'type': item.get('type', 'Part'),
                'product': item.get('product', ''),
                'description': item.get('description', ''),
                'uom': item.get('uom', ''),
                'assembly': item.get('assembly', False),
                'rev_no': item.get('rev_no', 0),
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1
            
    return {
        'created': created_count,
        'updated': updated_count,
        'total': created_count + updated_count
    }

def import_bom_data(bom_component_list):
    """
    Import Bill of Materials component data.
    
    Expected format for each component:
    {
        'parent_item_code': 'PARENT123',
        'child_item_code': 'CHILD456',
        'quantity': 2.0,
        'case_no': 'CASE1'
    }
    """
    created_count = 0
    updated_count = 0
    error_count = 0
    errors = []
    
    for component in bom_component_list:
        try:
            parent_item = ItemMaster.objects.get(item_code=component['parent_item_code'])
            
            # Make sure parent is marked as a BOM type
            if parent_item.type != 'BOM':
                parent_item.type = 'BOM'
                parent_item.save()
                
            child_item = ItemMaster.objects.get(item_code=component['child_item_code'])
            
            obj, created = BOMComponent.objects.update_or_create(
                parent_item=parent_item,
                child_item=child_item,
                case_no=component.get('case_no', ''),
                defaults={
                    'quantity': component.get('quantity', 1.0)
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        except ItemMaster.DoesNotExist as e:
            error_count += 1
            errors.append(f"Item not found: {str(e)} for component {component['parent_item_code']} > {component['child_item_code']}")
        except Exception as e:
            error_count += 1
            errors.append(f"Error importing BOM component {component.get('parent_item_code', '')}: {str(e)}")
            
    return {
        'created': created_count,
        'updated': updated_count,
        'error_count': error_count,
        'errors': errors,
        'total': created_count + updated_count
    }