#!/usr/bin/env python
"""
Test script to create work orders with different quantities for testing multi-quantity assembly workflow
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.work_order.models import WorkOrder, PCBType
from backend.apps.item_master.models import ItemMaster

def clear_all_workorders():
    """Clear all existing work orders"""
    print("Clearing existing work orders...")
    WorkOrder.objects.all().delete()
    print("All work orders cleared")

def ensure_pcb_types():
    """Ensure PCB types exist"""
    print("Ensuring PCB types exist...")
    
    ybs_type, created = PCBType.objects.get_or_create(
        code='YBS',
        defaults={
            'name': 'Yarn Breaking System',
            'prefix': '5YB',
            'active': True,
            'description': 'YBS PCB Assembly Type'
        }
    )
    if created:
        print("Created YBS PCB type")
    
    rsm_type, created = PCBType.objects.get_or_create(
        code='RSM',
        defaults={
            'name': 'Ring Spinning Machine',
            'prefix': '5RS',
            'active': True,
            'description': 'RSM PCB Assembly Type'
        }
    )
    if created:
        print("Created RSM PCB type")
    
    return ybs_type, rsm_type

def create_test_workorders():
    """Create test work orders for testing multi-quantity workflow"""
    print("Creating test work orders...")
    
    # Clear existing work orders first
    clear_all_workorders()
    
    # Ensure PCB types exist
    ybs_type, rsm_type = ensure_pcb_types()
    
    # Test work orders data with different quantities
    test_orders = [
        {
            'product': 'YBS Standard PCB Assembly',
            'item_code': '5YB011056',
            'pcb_type': ybs_type,
            'description': 'Single unit YBS assembly for testing',
            'quantity': 1,  # Single unit order
            'machine_no': 'YBS-LINE-01',
            'customer_name': 'Tech Corp Ltd',
            'target_date': datetime.now() + timedelta(days=3),
            'released_by': 'Test Manager',
            'remarks': 'Single unit YBS assembly for basic testing',
            'priority': 'normal',
            'status': 'Pending'
        },
        {
            'product': 'YBS Advanced PCB Assembly',
            'item_code': '5YB011100',
            'pcb_type': ybs_type,
            'description': 'Multi-unit YBS assembly for quantity testing',
            'quantity': 5,  # Multi-unit order
            'machine_no': 'YBS-LINE-02',
            'customer_name': 'Manufacturing Solutions Inc',
            'target_date': datetime.now() + timedelta(days=2),
            'released_by': 'Test Manager',
            'remarks': 'Multi-unit YBS assembly - 5 units required for testing',
            'priority': 'high',
            'status': 'Pending'
        },
        {
            'product': 'RSM Standard PCB Assembly',
            'item_code': '5RS011027',
            'pcb_type': rsm_type,
            'description': 'Single unit RSM assembly for testing',
            'quantity': 1,  # Single unit order
            'machine_no': 'RSM-LINE-01',
            'customer_name': 'Industrial Electronics Co',
            'target_date': datetime.now() + timedelta(days=4),
            'released_by': 'Test Manager',
            'remarks': 'Single unit RSM assembly for basic testing',
            'priority': 'normal',
            'status': 'Pending'
        },
        {
            'product': 'RSM Advanced PCB Assembly',
            'item_code': '5RS011092',
            'pcb_type': rsm_type,
            'description': 'Multi-unit RSM assembly for quantity testing',
            'quantity': 3,  # Multi-unit order
            'machine_no': 'RSM-LINE-02',
            'customer_name': 'Automation Systems Ltd',
            'target_date': datetime.now() + timedelta(days=5),
            'released_by': 'Test Manager',
            'remarks': 'Multi-unit RSM assembly - 3 units required for testing',
            'priority': 'high',
            'status': 'Pending'
        },
        {
            'product': 'YBS High Volume Assembly',
            'item_code': '5YB011111',
            'pcb_type': ybs_type,
            'description': 'High volume YBS assembly for stress testing',
            'quantity': 10,  # High volume order
            'machine_no': 'YBS-LINE-03',
            'customer_name': 'Mass Production Corp',
            'target_date': datetime.now() + timedelta(days=7),
            'released_by': 'Test Manager',
            'remarks': 'High volume YBS assembly - 10 units for stress testing',
            'priority': 'urgent',
            'status': 'Pending'
        }
    ]
    
    created_orders = []
    
    for order_data in test_orders:
        try:            # Check if item master exists, create if not
            item_master, created = ItemMaster.objects.get_or_create(
                item_code=order_data['item_code'],
                defaults={
                    'sno': ItemMaster.objects.count() + 1,
                    'type': 'Part',
                    'product': order_data['product'],
                    'description': f"PCB Assembly for {order_data['pcb_type'].code} type - {order_data['product']}",
                    'uom': 'PCS',
                    'code': order_data['item_code'],
                    'assembly': True,
                    'burn_test': False,
                    'packing': False
                }
            )
            if created:
                print(f"Created item master for {order_data['item_code']}")
            
            # Create work order
            work_order = WorkOrder.objects.create(**order_data)
            created_orders.append(work_order)
            
            print(f"Created work order: {work_order.id} - {work_order.product} (Qty: {work_order.quantity})")
            
        except Exception as e:
            print(f"Error creating work order for {order_data['item_code']}: {str(e)}")
            continue
    
    print(f"\nSuccessfully created {len(created_orders)} test work orders!")
    
    # Print summary
    print("\n" + "="*60)
    print("TEST WORK ORDERS SUMMARY")
    print("="*60)
    for order in created_orders:
        status_indicator = "🟢" if order.quantity == 1 else "🔵" if order.quantity <= 5 else "🟠"
        print(f"{status_indicator} {order.id}: {order.product}")
        print(f"   Item Code: {order.item_code}")
        print(f"   Quantity: {order.quantity} units")
        print(f"   PCB Type: {order.pcb_type.code}")
        print(f"   Priority: {order.priority}")
        print(f"   Status: {order.status}")
        print()
    
    print("Testing Instructions:")
    print("1. Single unit orders (YBS011056, RSM011027)")
    print("   - Should be removed from pending when completed")
    print("2. Multi-unit orders (YBS011100: 5 units, RSM011092: 3 units)")
    print("   - Should show progress and remain in pending until all units complete")
    print("3. High volume order (YBS011111: 10 units)")
    print("   - For stress testing the multi-quantity workflow")
    print("\nYou can now test the quantity-based assembly workflow!")

if __name__ == '__main__':
    try:
        create_test_workorders()
        print("\nTest work orders created successfully!")
        
    except Exception as e:
        print(f"Error setting up test data: {str(e)}")
        sys.exit(1)
