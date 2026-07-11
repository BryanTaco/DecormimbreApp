import uuid
from django.db import migrations, models


def generar_tokens(apps, schema_editor):
    Pedido = apps.get_model("pedidos", "Pedido")
    for pedido in Pedido.objects.all():
        pedido.tracking_token = uuid.uuid4()
        pedido.save(update_fields=["tracking_token"])


class Migration(migrations.Migration):

    dependencies = [
        ("pedidos", "0004_remove_tareaproduccion_unique_pedido_tipo_tarea_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="pedido",
            name="tracking_token",
            field=models.UUIDField(default=uuid.uuid4, editable=False, null=True),
        ),
        migrations.RunPython(generar_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="pedido",
            name="tracking_token",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
