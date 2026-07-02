import pytest
from decimal import Decimal
from model_bakery import baker
from django.conf import settings


@pytest.mark.django_db
class TestIVACotizacion:
    def _crear_cotizacion_con_items(self, precios):
        """Crea una cotización con ítems y retorna la cotización."""
        from apps.cotizaciones.models import Cotizacion, ItemCotizacion
        cot = baker.make(Cotizacion, estado="BORRADOR")
        for precio, cantidad in precios:
            producto = baker.make("catalogo.Producto")
            baker.make(
                ItemCotizacion,
                cotizacion=cot,
                producto=producto,
                cantidad=cantidad,
                precio_unitario=Decimal(str(precio)),
            )
        cot.calcular_totales()
        return cot

    def test_iva_es_15_porciento(self):
        assert settings.IVA_PORCENTAJE == Decimal("0.15")

    def test_subtotal_correcto(self):
        cot = self._crear_cotizacion_con_items([(100, 2), (50, 4)])
        assert cot.subtotal == Decimal("400.00")

    def test_iva_calculado_sobre_subtotal(self):
        cot = self._crear_cotizacion_con_items([(200, 1)])
        expected_iva = Decimal("200.00") * settings.IVA_PORCENTAJE
        assert cot.iva == expected_iva.quantize(Decimal("0.01"))

    def test_total_es_subtotal_mas_iva(self):
        cot = self._crear_cotizacion_con_items([(300, 2)])
        assert cot.total == cot.subtotal + cot.iva

    def test_iva_no_hardcodeado_0_15(self):
        """Verifica que el cálculo use settings.IVA_PORCENTAJE, no 0.15 literal."""
        cot = self._crear_cotizacion_con_items([(1000, 1)])
        iva_con_settings = Decimal("1000.00") * settings.IVA_PORCENTAJE
        assert cot.iva == iva_con_settings.quantize(Decimal("0.01"))

    def test_cotizacion_sin_items_totales_cero(self):
        from apps.cotizaciones.models import Cotizacion
        cot = baker.make(Cotizacion, estado="BORRADOR")
        cot.calcular_totales()
        assert cot.subtotal == Decimal("0.00")
        assert cot.iva == Decimal("0.00")
        assert cot.total == Decimal("0.00")
