from django.urls import path
from .views import (
    CategoriaListCreateView, CategoriaDetailView,
    ProductoListCreateView, ProductoDetailView,
    ColorListCreateView, ColorDetailView,
)

urlpatterns = [
    path("categorias/", CategoriaListCreateView.as_view(), name="categorias_list"),
    path("categorias/<uuid:pk>/", CategoriaDetailView.as_view(), name="categorias_detail"),
    path("productos/", ProductoListCreateView.as_view(), name="productos_list"),
    path("productos/<uuid:pk>/", ProductoDetailView.as_view(), name="productos_detail"),
    path("colores/", ColorListCreateView.as_view(), name="colores_list"),
    path("colores/<uuid:pk>/", ColorDetailView.as_view(), name="colores_detail"),
]
