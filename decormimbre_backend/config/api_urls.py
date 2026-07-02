from django.urls import path, include

urlpatterns = [
    path("auth/", include("apps.authentication.urls")),
    path("clientes/", include("apps.clientes.urls")),
    path("catalogo/", include("apps.catalogo.urls")),
    path("inventario/", include("apps.inventario.urls")),
    path("cotizaciones/", include("apps.cotizaciones.urls")),
    path("pedidos/", include("apps.pedidos.urls")),
    path("proveedores/", include("apps.proveedores.urls")),
    path("reportes/", include("apps.reportes.urls")),
    path("admin/", include("apps.authentication.admin_urls")),
]
