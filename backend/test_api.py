#!/usr/bin/env python
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

def test_apis():
    User = get_user_model()
    client = APIClient()

    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        print('No admin user found')
        return

    token = AccessToken.for_user(admin_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Test PCB items API
    print("Testing PCB Items API...")
    response = client.get('/api/pcb-items/')
    print(f'Status: {response.status_code}')
    
    if response.status_code == 200:
        if hasattr(response.data, 'keys') and 'results' in response.data:
            print(f'Paginated response - total: {response.data.get("count", 0)}')
            print(f'Items in this page: {len(response.data["results"])}')
            if response.data['results']:
                item = response.data['results'][0]
                print(f'First PCB item: {item.get("item_code", "N/A")} - {item.get("name", "N/A")}')
        else:
            print(f'Direct list response - count: {len(response.data)}')
            if response.data:
                item = response.data[0]
                print(f'First PCB item: {item.get("item_code", "N/A")} - {item.get("name", "N/A")}')
    else:
        print(f'Error: {response.data}')

    # Test work order creation
    print("\nTesting Work Order Creation...")
    test_data = {
        'product': 'Test Product',
        'item_code': 'YBS011056',
        'description': 'Test work order',
        'quantity': 10,
        'target_date': '2025-06-15',
        'released_by': 'System'
    }
    
    response = client.post('/api/work-order/', test_data)
    print(f'Work Order Creation Status: {response.status_code}')
    if response.status_code == 201:
        print('Work order created successfully!')
        print(f'Created work order ID: {response.data.get("id", "N/A")}')
    else:
        print(f'Error creating work order: {response.data}')

if __name__ == '__main__':
    test_apis()
