"""
Management command para crear alertas de entrega según fecha_promesa_entrega.
Ejecutar desde cron/task scheduler:
    python manage.py verificar_alertas_entrega
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.pedidos.models import Pedido, AlertaEntrega


class Command(BaseCommand):
    help = "Crea alertas de entrega para pedidos próximos a vencer o vencidos."

    def handle(self, *args, **options):
        hoy = timezone.now().date()
        pendientes = Pedido.objects.filter(
            estado__in=["PENDIENTE", "EN_PRODUCCION", "LISTO_ENTREGA"],
            fecha_promesa_entrega__isnull=False,
        )

        creadas = 0
        for pedido in pendientes:
            if pedido.fecha_promesa_entrega is None:  # el filtro ya lo excluye; guardia para el type checker
                continue
            dias_restantes = (pedido.fecha_promesa_entrega - hoy).days
            if dias_restantes < 0:
                tipo = "VENCIDO"
                mensaje = (
                    f"El pedido {pedido.numero} tenía fecha de entrega "
                    f"{pedido.fecha_promesa_entrega.strftime('%d/%m/%Y')} "
                    f"y lleva {abs(dias_restantes)} días de retraso."
                )
            elif dias_restantes <= 3:
                tipo = "PROXIMO_VENCER"
                mensaje = (
                    f"El pedido {pedido.numero} debe entregarse en "
                    f"{dias_restantes} día(s) ({pedido.fecha_promesa_entrega.strftime('%d/%m/%Y')})."
                )
            else:
                continue

            ya_existe = AlertaEntrega.objects.filter(
                pedido=pedido, tipo=tipo, revisada=False
            ).exists()
            if not ya_existe:
                AlertaEntrega.objects.create(
                    pedido=pedido, tipo=tipo, mensaje=mensaje
                )
                creadas += 1

        self.stdout.write(
            self.style.SUCCESS(f"Alertas de entrega verificadas. Creadas: {creadas}.")
        )
