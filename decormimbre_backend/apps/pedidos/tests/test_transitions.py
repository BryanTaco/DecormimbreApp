import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from model_bakery import baker


@pytest.mark.django_db
class TestPedidoTransitions:
    def _pedido(self):
        from apps.pedidos.models import Pedido
        return baker.make(Pedido, estado="PENDIENTE")

    def _usuario(self):
        return baker.make("authentication.Usuario")

    def test_pendiente_puede_pasar_a_en_produccion(self):
        pedido = self._pedido()
        pedido.cambiar_estado("EN_PRODUCCION", self._usuario())
        assert pedido.estado == "EN_PRODUCCION"

    def test_pendiente_puede_cancelarse(self):
        pedido = self._pedido()
        pedido.cambiar_estado("CANCELADO", self._usuario())
        assert pedido.estado == "CANCELADO"

    def test_en_produccion_puede_pasar_a_listo_entrega(self):
        pedido = self._pedido()
        u = self._usuario()
        pedido.cambiar_estado("EN_PRODUCCION", u)
        pedido.cambiar_estado("LISTO_ENTREGA", u)
        assert pedido.estado == "LISTO_ENTREGA"

    def test_listo_entrega_puede_entregarse(self):
        pedido = self._pedido()
        u = self._usuario()
        pedido.cambiar_estado("EN_PRODUCCION", u)
        pedido.cambiar_estado("LISTO_ENTREGA", u)
        pedido.cambiar_estado("ENTREGADO", u)
        assert pedido.estado == "ENTREGADO"

    def test_entregado_registra_fecha_entrega_real(self):
        from django.utils import timezone
        pedido = self._pedido()
        u = self._usuario()
        pedido.cambiar_estado("EN_PRODUCCION", u)
        pedido.cambiar_estado("LISTO_ENTREGA", u)
        pedido.cambiar_estado("ENTREGADO", u)
        assert pedido.fecha_entrega_real == timezone.now().date()

    def test_pendiente_no_puede_entregarse_directamente(self):
        pedido = self._pedido()
        with pytest.raises(ValidationError):
            pedido.cambiar_estado("ENTREGADO", self._usuario())

    def test_cancelado_no_puede_reactivarse(self):
        pedido = self._pedido()
        u = self._usuario()
        pedido.cambiar_estado("CANCELADO", u)
        with pytest.raises(ValidationError):
            pedido.cambiar_estado("PENDIENTE", u)

    def test_entregado_es_estado_final(self):
        pedido = self._pedido()
        u = self._usuario()
        pedido.cambiar_estado("EN_PRODUCCION", u)
        pedido.cambiar_estado("LISTO_ENTREGA", u)
        pedido.cambiar_estado("ENTREGADO", u)
        with pytest.raises(ValidationError):
            pedido.cambiar_estado("CANCELADO", u)

    def test_transicion_registra_log_estado(self):
        from apps.pedidos.models import LogEstadoPedido
        pedido = self._pedido()
        u = self._usuario()
        pedido.cambiar_estado("EN_PRODUCCION", u)
        log = LogEstadoPedido.objects.filter(pedido=pedido).first()
        assert log.estado_anterior == "PENDIENTE"
        assert log.estado_nuevo == "EN_PRODUCCION"
        assert log.cambiado_por == u
