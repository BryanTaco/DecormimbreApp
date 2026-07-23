from django.urls import path
from .public_views import CotizacionRapidaView, ProductosPublicosView, ValidarCedulaView
from .asistente_views import AsistenteView
from .cotizador_views import CotizadorProductosView, CotizarView

urlpatterns = [
    path("cotizacion-rapida/", CotizacionRapidaView.as_view(), name="cotizacion_rapida"),
    path("productos/", ProductosPublicosView.as_view(), name="productos_publicos"),
    path("validar-cedula/", ValidarCedulaView.as_view(), name="validar_cedula"),
    path("asistente/", AsistenteView.as_view(), name="asistente"),
    path("cotizador/productos/", CotizadorProductosView.as_view(), name="cotizador_productos"),
    path("cotizador/", CotizarView.as_view(), name="cotizador"),
]
