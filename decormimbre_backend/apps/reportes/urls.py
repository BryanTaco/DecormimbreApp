from django.urls import path
from .views import DashboardKPIsView, ExcelReporteView

urlpatterns = [
    path("dashboard/", DashboardKPIsView.as_view(), name="dashboard_kpis"),
    path("excel/", ExcelReporteView.as_view(), name="reporte_excel"),
]
