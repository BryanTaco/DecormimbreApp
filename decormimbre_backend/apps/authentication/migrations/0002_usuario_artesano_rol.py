from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usuario',
            name='rol',
            field=models.CharField(
                choices=[
                    ('ADMIN', 'Administrador'),
                    ('PROPIETARIO', 'Propietario'),
                    ('ARTESANO', 'Artesano'),
                ],
                default='PROPIETARIO',
                max_length=20,
            ),
        ),
    ]
