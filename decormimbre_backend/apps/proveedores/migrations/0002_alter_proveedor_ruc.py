# Generated manually to support community suppliers without a tax id.
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("proveedores", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="proveedor",
            name="ruc",
            field=models.CharField(blank=True, default="", max_length=13, unique=True),
        ),
    ]
