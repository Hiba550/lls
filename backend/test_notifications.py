#!/usr/bin/env python
import os
import django
import json

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

def test_notifications_api():
    # Get admin user
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if not admin_user:
        print('No admin user found')
        return
    
    # Create API client
    client = APIClient()
    
    # Generate JWT token for the user
    token = AccessToken.for_user(admin_user)
    
    # Set authorization header
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Test the notifications endpoint
    response = client.get('/api/notifications/')
    
    print('=== Response Details ===')
    print(f'Status Code: {response.status_code}')
    print(f'Response Type: {type(response.data)}')
    
    if hasattr(response.data, 'keys'):
        print(f'Response Keys: {list(response.data.keys())}')
        print(f'Has results: {"results" in response.data}')
        
        if 'results' in response.data:
            print(f'Results length: {len(response.data["results"])}')
            if response.data['results']:
                first_result = response.data['results'][0]
                print(f'First result keys: {list(first_result.keys())}')
                print(f'First result sample: {first_result}')
    
    # Also test the stats endpoint
    stats_response = client.get('/api/notifications/stats/')
    print(f'\n=== Stats Response ===')
    print(f'Stats Status Code: {stats_response.status_code}')
    print(f'Stats Data: {stats_response.data}')

if __name__ == '__main__':
    test_notifications_api()
