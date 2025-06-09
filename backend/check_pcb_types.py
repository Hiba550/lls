import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.work_order.models import PCBType

print("PCB Types in database:")
print("=" * 40)
for pcb_type in PCBType.objects.all():
    print(f"ID: {pcb_type.id}, Code: {pcb_type.code}, Name: {pcb_type.name}")
