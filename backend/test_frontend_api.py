#!/usr/bin/env python
import requests
import json

def test_frontend_endpoints():
    base_url = 'http://localhost:8000'
    
    print("Testing frontend API endpoints...")
    
    # Test PCB Types endpoint
    try:
        response = requests.get(f'{base_url}/api/pcb-types/')
        print(f'PCB Types: {response.status_code}')
        if response.status_code == 200:
            data = response.json()
            if 'results' in data:
                print(f'  Total PCB Types: {data["count"]}')
                for item in data['results']:
                    print(f'    - {item["code"]}: {item["name"]}')
    except Exception as e:
        print(f'PCB Types error: {e}')
    
    # Test PCB Items endpoint (with higher page size)
    try:
        response = requests.get(f'{base_url}/api/pcb-items/?page_size=100')
        print(f'PCB Items: {response.status_code}')
        if response.status_code == 200:
            data = response.json()
            if 'results' in data:
                print(f'  Total PCB Items: {data["count"]}')
                ybs_items = [item for item in data['results'] if item['category'] == 'YBS']
                rsm_items = [item for item in data['results'] if item['category'] == 'RSM']
                print(f'  YBS Items: {len(ybs_items)}')
                print(f'  RSM Items: {len(rsm_items)}')
                print(f'  Sample YBS: {ybs_items[0]["item_code"] if ybs_items else "None"}')
                print(f'  Sample RSM: {rsm_items[0]["item_code"] if rsm_items else "None"}')
    except Exception as e:
        print(f'PCB Items error: {e}')
        
    # Test Item Master endpoint
    try:
        response = requests.get(f'{base_url}/api/item-master/')
        print(f'Item Master: {response.status_code}')
        if response.status_code == 200:
            data = response.json()
            count = data.get('count', len(data)) if isinstance(data, dict) else len(data)
            print(f'  Total Item Master records: {count}')
    except Exception as e:
        print(f'Item Master error: {e}')

if __name__ == '__main__':
    test_frontend_endpoints()
