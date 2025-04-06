from django.core.management.base import BaseCommand
from backend.apps.item_master.utils import create_sample_ysb_data

class Command(BaseCommand):
    help = 'Creates sample YBS data in the database'

    def handle(self, *args, **options):
        result = create_sample_ysb_data()
        self.stdout.write(self.style.SUCCESS(result))