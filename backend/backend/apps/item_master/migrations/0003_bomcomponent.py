# Generated by Django 4.2 on 2025-03-27 00:07

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("item_master", "0002_assemblyprocess_scannedpart_assemblylog"),
    ]

    operations = [
        migrations.CreateModel(
            name="BOMComponent",
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
                (
                    "quantity",
                    models.DecimalField(decimal_places=2, default=1, max_digits=10),
                ),
                ("case_no", models.CharField(blank=True, max_length=50, null=True)),
                (
                    "child_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="bom_children",
                        to="item_master.itemmaster",
                    ),
                ),
                (
                    "parent_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="bom_parents",
                        to="item_master.itemmaster",
                    ),
                ),
            ],
            options={
                "verbose_name": "BOM Component",
                "verbose_name_plural": "BOM Components",
                "ordering": ["case_no", "child_item__item_code"],
                "unique_together": {("parent_item", "child_item", "case_no")},
            },
        ),
    ]
