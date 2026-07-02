from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cotizaciones', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='cotizacion',
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
            model_name='cotizacion',
            name='fecha_promesa_entrega',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='itemcotizacion',
            name='descuento',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                default=Decimal('0.00'),
                help_text='Porcentaje de descuento (0–100).',
                max_digits=5,
            ),
        ),
    ]
