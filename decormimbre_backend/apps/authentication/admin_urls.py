from django.urls import path
from .views import LogActividadListView

urlpatterns = [
    path("logs/", LogActividadListView.as_view(), name="logs_actividad"),
]
