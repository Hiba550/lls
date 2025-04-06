# Generated by Django 4.2.10 on 2025-03-27 17:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('item_master', '0003_bomcomponent'),
    ]

    operations = [
        migrations.CreateModel(
            name='PCBItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('cable_description', models.CharField(max_length=255)),
                ('category', models.CharField(choices=[('YBS', 'YBS'), ('RSM', 'RSM')], max_length=10)),
                ('spindle_count', models.IntegerField(blank=True, null=True)),
                ('pitch', models.CharField(blank=True, max_length=30, null=True)),
                ('is_active', models.BooleanField(default=True)),
            ],
        ),
    ]
