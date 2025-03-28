# Generated by Django 4.2 on 2025-03-23 08:31

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="WorkOrder",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("product", models.CharField(max_length=50)),
                ("item_code", models.CharField(max_length=50)),
                ("description", models.TextField()),
                ("quantity", models.IntegerField()),
                ("machine_no", models.CharField(blank=True, max_length=50, null=True)),
                (
                    "customer_name",
                    models.CharField(blank=True, max_length=100, null=True),
                ),
                ("target_date", models.DateField()),
                ("released_by", models.CharField(max_length=100)),
                ("remarks", models.TextField(blank=True, null=True)),
            ],
        ),
    ]
