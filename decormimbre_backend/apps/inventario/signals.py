from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MovimientoInventario, AlertaStock


@receiver(post_save, sender=MovimientoInventario)
def verificar_stock_minimo(sender, instance, created, **kwargs):
    """Crea AlertaStock si la materia prima cayó en stock crítico."""
    if not created:
        return
    mp = instance.materia_prima
    if mp.stock_actual <= mp.stock_minimo:
        if not AlertaStock.objects.filter(materia_prima=mp, revisada=False).exists():
            AlertaStock.objects.create(
                materia_prima=mp,
                stock_al_momento=mp.stock_actual,
            )
