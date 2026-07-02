from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalogo', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='producto',
            name='lista_materiales_ref',
        ),
        migrations.AddField(
            model_name='producto',
            name='material',
            field=models.CharField(
                choices=[
                    ('MIMBRE', 'Mimbre (natural)'),
                    ('POLIALUMINIO', 'Polialuminio (Tetrapack reciclado)'),
                    ('COMBINADO', 'Combinado (mimbre y polialuminio)'),
                ],
                default='COMBINADO',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='producto',
            name='tiempo_produccion_dias',
            field=models.PositiveSmallIntegerField(
                default=7,
                help_text='Días estimados para fabricar una unidad de este producto.',
            ),
        ),
    ]
