from decimal import Decimal
from datetime import date
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from utils.responses import success_response, error_response
from apps.authentication.permissions import IsAdminOrPropietario
from apps.pedidos.models import Pedido
from apps.cotizaciones.models import Cotizacion
from apps.inventario.models import AlertaStock
from apps.clientes.models import Cliente
from .excel_generator import generar_reporte_excel


class DashboardKPIsView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def get(self, request):
        hoy = date.today()
        inicio_mes = hoy.replace(day=1)

        pedidos_mes = Pedido.objects.filter(fecha_creacion__date__gte=inicio_mes)
        ventas_mes = pedidos_mes.aggregate(total=Sum("total"))["total"] or Decimal("0.00")
        pedidos_activos = Pedido.objects.exclude(estado__in=["ENTREGADO", "CANCELADO"]).count()

        cots_pendientes = Cotizacion.objects.filter(estado__in=["BORRADOR", "ENVIADA"]).count()
        alertas_stock = AlertaStock.objects.filter(revisada=False).count()
        clientes_activos = Cliente.objects.filter(activo=True).count()

        pedidos_por_estado = dict(
            Pedido.objects.values("estado").annotate(n=Count("id")).values_list("estado", "n")
        )

        data = {
            "ventas_mes_actual": float(ventas_mes),
            "pedidos_nuevos_mes": pedidos_mes.count(),
            "pedidos_activos": pedidos_activos,
            "cotizaciones_pendientes": cots_pendientes,
            "alertas_stock_pendientes": alertas_stock,
            "clientes_activos": clientes_activos,
            "pedidos_por_estado": pedidos_por_estado,
        }
        return success_response(data=data)


class ExcelReporteView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def get(self, request):
        fecha_inicio_str = request.query_params.get("fecha_inicio")
        fecha_fin_str = request.query_params.get("fecha_fin")

        fecha_inicio = None
        fecha_fin = None
        try:
            if fecha_inicio_str:
                fecha_inicio = date.fromisoformat(fecha_inicio_str)
            if fecha_fin_str:
                fecha_fin = date.fromisoformat(fecha_fin_str)
        except ValueError:
            return error_response("FECHA_INVALIDA", "Formato de fecha debe ser YYYY-MM-DD.", status_code=400)

        try:
            excel_bytes = generar_reporte_excel(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        except Exception as e:
            return error_response("EXCEL_ERROR", f"Error generando reporte: {str(e)}", status_code=500)

        from django.http import HttpResponse
        response = HttpResponse(
            excel_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="reporte-decormimbre.xlsx"'
        return response
