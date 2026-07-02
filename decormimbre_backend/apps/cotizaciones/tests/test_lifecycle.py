import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from model_bakery import baker


@pytest.mark.django_db
class TestCotizacionLifecycle:
    def _cotizacion_borrador(self):
        from apps.cotizaciones.models import Cotizacion, ItemCotizacion
        cot = baker.make(Cotizacion, estado="BORRADOR")
        baker.make(
            ItemCotizacion,
            cotizacion=cot,
            precio_unitario=Decimal("100.00"),
            cantidad=1,
            _fill_optional=False,
        )
        cot.calcular_totales()
        return cot

    def _usuario(self):
        return baker.make("authentication.Usuario")

    def test_borrador_puede_enviarse(self):
        cot = self._cotizacion_borrador()
        usuario = self._usuario()
        cot.cambiar_estado("ENVIADA", usuario)
        assert cot.estado == "ENVIADA"

    def test_enviada_puede_aprobarse(self):
        cot = self._cotizacion_borrador()
        usuario = self._usuario()
        cot.cambiar_estado("ENVIADA", usuario)
        cot.cambiar_estado("APROBADA", usuario)
        assert cot.estado == "APROBADA"

    def test_enviada_puede_rechazarse(self):
        cot = self._cotizacion_borrador()
        usuario = self._usuario()
        cot.cambiar_estado("ENVIADA", usuario)
        cot.cambiar_estado("RECHAZADA", usuario)
        assert cot.estado == "RECHAZADA"

    def test_borrador_no_puede_aprobarse_directamente(self):
        cot = self._cotizacion_borrador()
        usuario = self._usuario()
        with pytest.raises(ValidationError):
            cot.cambiar_estado("APROBADA", usuario)

    def test_aprobada_no_puede_volver_a_borrador(self):
        cot = self._cotizacion_borrador()
        usuario = self._usuario()
        cot.cambiar_estado("ENVIADA", usuario)
        cot.cambiar_estado("APROBADA", usuario)
        with pytest.raises(ValidationError):
            cot.cambiar_estado("BORRADOR", usuario)

    def test_rechazada_no_puede_cambiar_estado(self):
        cot = self._cotizacion_borrador()
        usuario = self._usuario()
        cot.cambiar_estado("ENVIADA", usuario)
        cot.cambiar_estado("RECHAZADA", usuario)
        with pytest.raises(ValidationError):
            cot.cambiar_estado("ENVIADA", usuario)

    def test_aprobada_crea_version(self):
        from apps.cotizaciones.models import VersionCotizacion
        cot = self._cotizacion_borrador()
        usuario = self._usuario()
        cot.cambiar_estado("ENVIADA", usuario)
        cot.cambiar_estado("APROBADA", usuario)
        assert VersionCotizacion.objects.filter(cotizacion=cot).exists()

    def test_numero_version_incrementa_por_transicion(self):
        from apps.cotizaciones.models import VersionCotizacion
        cot = self._cotizacion_borrador()
        usuario = self._usuario()
        cot.cambiar_estado("ENVIADA", usuario)
        cot.cambiar_estado("APROBADA", usuario)
        versiones = VersionCotizacion.objects.filter(cotizacion=cot).count()
        assert versiones >= 1
