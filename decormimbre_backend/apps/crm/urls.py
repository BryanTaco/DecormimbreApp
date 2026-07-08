from django.urls import path
from .views import (
    OportunidadListCreateView, OportunidadDetailView,
    InteraccionListCreateView,
    TareaListCreateView, TareaDetailView,
    Cliente360View, PipelineResumenView,
)

urlpatterns = [
    path("oportunidades/", OportunidadListCreateView.as_view(), name="crm_oportunidades"),
    path("oportunidades/<uuid:pk>/", OportunidadDetailView.as_view(), name="crm_oportunidad_detail"),
    path("interacciones/", InteraccionListCreateView.as_view(), name="crm_interacciones"),
    path("tareas/", TareaListCreateView.as_view(), name="crm_tareas"),
    path("tareas/<uuid:pk>/", TareaDetailView.as_view(), name="crm_tarea_detail"),
    path("clientes/<uuid:pk>/360/", Cliente360View.as_view(), name="crm_cliente_360"),
    path("pipeline/resumen/", PipelineResumenView.as_view(), name="crm_pipeline_resumen"),
]
