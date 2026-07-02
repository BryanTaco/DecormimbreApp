from django.urls import path
from .views import (
    ProveedorListCreateView, ProveedorDetailView,
    OrdenTrabajoListCreateView, OrdenTrabajoDetailView,
)

urlpatterns = [
    path("", ProveedorListCreateView.as_view(), name="proveedores_list"),
    path("<uuid:pk>/", ProveedorDetailView.as_view(), name="proveedores_detail"),
    path("ordenes/", OrdenTrabajoListCreateView.as_view(), name="ordenes_list"),
    path("ordenes/<uuid:pk>/", OrdenTrabajoDetailView.as_view(), name="ordenes_detail"),
]
