#!/usr/bin/env python
"""
Script to add test work orders for testing quantity-based assembly workflows
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.work_order.models import WorkOrder
from backend.apps.item_master.models import ItemMaster

def clear_all_workorders():
    """Clear all existing work orders"""
    print("Clearing all existing work orders...")
    deleted_count = WorkOrder.objects.all().count()
    WorkOrder.objects.all().delete()
    print(f"Deleted {deleted_count} work orders")

def create_test_workorders():
    """Create test work orders for testing"""
    print("Creating test work orders...")
    
    # Clear existing work orders first
    clear_all_workorders()
    
    # Test work orders data
    test_orders = [
        {
            'id': 'WO-YBS-001',
            'item_code': '5YB011056',
            'product': 'YBS Standard PCB Assembly',
            'quantity': 1,  # Single unit order
            'priority': 'medium',
            'status': 'pending',
            'target_date': datetime.now() + timedelta(days=3),
            'customer_name': 'Tech Corp Ltd',
            'machine_type': 'YBS Standard',
            'notes': 'Single unit YBS assembly for testing',
            'pcb_type': 'YBS'
        },
        {
            'id': 'WO-YBS-002', 
            'item_code': '5YB011100',
            'product': 'YBS Advanced PCB Assembly',
            'quantity': 5,  # Multi-unit order
            'priority': 'high',
            'status': 'pending',
            'target_date': datetime.now() + timedelta(days=2),
            'customer_name': 'Manufacturing Solutions Inc',
            'machine_type': 'YBS Advanced',
            'notes': 'Multi-unit YBS assembly - 5 units required',
            'pcb_type': 'YBS'
        },
        {
            'id': 'WO-RSM-001',
            'item_code': '5RS011027',
            'product': 'RSM Standard PCB Assembly',
            'quantity': 1,  # Single unit order
            'priority': 'medium',
            'status': 'pending',
            'target_date': datetime.now() + timedelta(days=4),
            'customer_name': 'Industrial Electronics Co',
            'machine_type': 'RSM Standard',
            'notes': 'Single unit RSM assembly for testing',
            'pcb_type': 'RSM'
        },
        {
            'id': 'WO-RSM-002',
            'item_code': '5RS011092',
            'product': 'RSM Advanced PCB Assembly',
            'quantity': 3,  # Multi-unit order
            'priority': 'high',
            'status': 'pending',
            'target_date': datetime.now() + timedelta(days=5),
            'customer_name': 'Automation Systems Ltd',
            'machine_type': 'RSM Advanced',
            'notes': 'Multi-unit RSM assembly - 3 units required',
            'pcb_type': 'RSM'
        }
    ]
    
    created_orders = []
    
    for order_data in test_orders:
        try:
            # Check if item master exists, create if not
            item_master, created = ItemMaster.objects.get_or_create(
                item_code=order_data['item_code'],
                defaults={
                    'item_name': order_data['product'],
                    'machine_type': order_data['machine_type'],
                    'type': 'Assembly',
                    'description': f"PCB Assembly for {order_data['pcb_type']} type",
                    'unit_of_measure': 'PCS',
                    'standard_cost': 150.00,
                    'created_by': 'system'
                }
            )
            
            if created:
                print(f"Created ItemMaster for {order_data['item_code']}")
            
            # Create work order
            work_order = WorkOrder.objects.create(
                id=order_data['id'],
                item_code=item_master,
                product=order_data['product'],
                quantity=order_data['quantity'],
                priority=order_data['priority'],
                status=order_data['status'],
                target_date=order_data['target_date'],
                customer_name=order_data['customer_name'],
                machine_type=order_data['machine_type'],
                notes=order_data['notes'],
                pcb_type=order_data['pcb_type'],
                created_by='system',
                completed_quantity=0,  # Start with 0 completed
                remaining_quantity=order_data['quantity']
            )
            
            created_orders.append(work_order)
            print(f"✓ Created work order: {work_order.id} - {work_order.product} (Qty: {work_order.quantity})")
            
        except Exception as e:
            print(f"✗ Error creating work order {order_data['id']}: {str(e)}")
    
    print(f"\nSuccessfully created {len(created_orders)} test work orders")
    return created_orders

def print_summary():
    """Print summary of all work orders"""
    print("\n" + "="*60)
    print("WORK ORDER SUMMARY")
    print("="*60)
    
    all_orders = WorkOrder.objects.all().order_by('pcb_type', 'quantity')
    
    if not all_orders:
        print("No work orders found in database")
        return
    
    ybs_orders = all_orders.filter(pcb_type='YBS')
    rsm_orders = all_orders.filter(pcb_type='RSM')
    
    print(f"\nYBS Orders ({ybs_orders.count()}):")
    print("-" * 30)
    for order in ybs_orders:
        print(f"  {order.id}: {order.product}")
        print(f"    Quantity: {order.quantity} | Status: {order.status}")
        print(f"    Target: {order.target_date.strftime('%Y-%m-%d')}")
        print(f"    Customer: {order.customer_name}")
        print()
    
    print(f"\nRSM Orders ({rsm_orders.count()}):")
    print("-" * 30)
    for order in rsm_orders:
        print(f"  {order.id}: {order.product}")
        print(f"    Quantity: {order.quantity} | Status: {order.status}")
        print(f"    Target: {order.target_date.strftime('%Y-%m-%d')}")
        print(f"    Customer: {order.customer_name}")
        print()
    
    print(f"Total work orders: {all_orders.count()}")

if __name__ == '__main__':
    print("Setting up test work orders for quantity-based assembly testing...")
    print("="*60)
    
    try:
        created_orders = create_test_workorders()
        print_summary()
        
        print("\n" + "="*60)
        print("TEST DATA SETUP COMPLETE!")
        print("="*60)
        print("\nTest scenarios available:")
        print("1. Single unit orders (WO-YBS-001, WO-RSM-001)")
        print("   - Should be removed from pending when completed")
        print("2. Multi-unit orders (WO-YBS-002: 5 units, WO-RSM-002: 3 units)")
        print("   - Should show progress and remain in pending until all units complete")
        print("\nYou can now test the quantity-based assembly workflow!")
        
    except Exception as e:
        print(f"Error setting up test data: {str(e)}")
        sys.exit(1)
