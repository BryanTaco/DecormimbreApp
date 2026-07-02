from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='materiaprima',
            name='unidad',
            field=models.CharField(
                choices=[
                    ('METRO', 'Metro lineal'),
                    ('METRO2', 'Metro cuadrado'),
                    ('KG', 'Kilogramo'),
                    ('UNIDAD', 'Unidad'),
                    ('ROLLO', 'Rollo'),
                    ('ATADO', 'Atado'),
                    ('PLANCHA', 'Plancha'),
                ],
                max_length=10,
            ),
        ),
    ]
