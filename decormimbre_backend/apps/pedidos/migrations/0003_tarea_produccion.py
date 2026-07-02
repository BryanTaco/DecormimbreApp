import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0002_pedido_artesanos_etapa_forma_pago'),
        ('authentication', '0002_usuario_artesano_rol'),
    ]

    operations = [
        # Actualizar choices de etapa_produccion en Pedido (agrega COJINES)
        migrations.AlterField(
            model_name='pedido',
            name='etapa_produccion',
            field=models.CharField(
                blank=True,
                choices=[
                    ('ESTRUCTURA', 'Fabricando estructura de polialuminio'),
                    ('TEJIDO', 'Tejiendo con mimbre'),
                    ('COJINES', 'Elaborando cojines'),
                    ('ACABADOS', 'Acabados y pintura'),
                    ('CONTROL_CALIDAD', 'Control de calidad'),
                ],
                max_length=20,
                null=True,
            ),
        ),
        # Crear tabla tareas_produccion
        migrations.CreateModel(
            name='TareaProduccion',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('tipo', models.CharField(
                    choices=[
                        ('ESTRUCTURA', 'Fabricando estructura de polialuminio'),
                        ('TEJIDO', 'Tejiendo con mimbre'),
                        ('COJINES', 'Elaborando cojines'),
                        ('ACABADOS', 'Acabados y pintura'),
                        ('CONTROL_CALIDAD', 'Control de calidad'),
                    ],
                    max_length=20,
                )),
                ('estado', models.CharField(
                    choices=[
                        ('PENDIENTE', 'Pendiente'),
                        ('EN_PROCESO', 'En proceso'),
                        ('COMPLETADA', 'Completada'),
                    ],
                    default='PENDIENTE',
                    max_length=20,
                )),
                ('orden', models.PositiveSmallIntegerField(default=0)),
                ('notas', models.TextField(blank=True)),
                ('iniciada_en', models.DateTimeField(blank=True, null=True)),
                ('completada_en', models.DateTimeField(blank=True, null=True)),
                ('pedido', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='tareas',
                    to='pedidos.pedido',
                )),
                ('artesano', models.ForeignKey(
                    blank=True,
                    limit_choices_to={'rol': 'ARTESANO'},
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='tareas_asignadas',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'tareas_produccion',
                'ordering': ['orden'],
            },
        ),
        migrations.AddConstraint(
            model_name='tareaproduccion',
            constraint=models.UniqueConstraint(
                fields=['pedido', 'tipo'],
                name='unique_pedido_tipo_tarea',
            ),
        ),
    ]
