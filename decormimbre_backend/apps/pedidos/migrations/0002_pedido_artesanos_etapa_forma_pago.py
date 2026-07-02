import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0001_initial'),
        ('authentication', '0002_usuario_artesano_rol'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedido',
            name='etapa_produccion',
            field=models.CharField(
                blank=True,
                choices=[
                    ('ESTRUCTURA', 'Fabricando estructura de polialuminio'),
                    ('TEJIDO', 'Tejiendo con mimbre'),
                    ('ACABADOS', 'Acabados y pintura'),
                    ('CONTROL_CALIDAD', 'Control de calidad'),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='pedido',
            name='forma_pago',
            field=models.CharField(
                choices=[
                    ('50_50', '50% anticipo – 50% contra entrega'),
                    ('100_ANTICIPO', '100% anticipado'),
                    ('100_ENTREGA', '100% contra entrega'),
                    ('PERSONALIZADO', 'Personalizado'),
                ],
                default='50_50',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='pedido',
            name='artesano_estructura',
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={'rol': 'ARTESANO'},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='pedidos_estructura',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='pedido',
            name='artesano_tejido',
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={'rol': 'ARTESANO'},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='pedidos_tejido',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
