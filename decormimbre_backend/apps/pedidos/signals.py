from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import ItemPedido


@receiver(post_save, sender=ItemPedido)
def actualizar_totales_pedido(sender, instance, **kwargs):
    """Recalcula totales del pedido cuando se guarda un ítem."""
    instance.pedido.calcular_totales()
