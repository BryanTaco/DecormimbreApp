from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from django.shortcuts import get_object_or_404

from utils.responses import success_response, error_response, validation_error_response
from utils.pagination import StandardPagination
from apps.authentication.permissions import IsAdminOrPropietario
from apps.clientes.models import Cliente

from .models import Oportunidad, Interaccion, Tarea
from .serializers import OportunidadSerializer, InteraccionSerializer, TareaSerializer


# ── Oportunidades (embudo / pipeline) ──────────────────────────────────────────
class OportunidadListCreateView(ListCreateAPIView):
    serializer_class = OportunidadSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Oportunidad.objects.select_related("cliente", "responsable")
        if etapa := self.request.query_params.get("etapa"):
            qs = qs.filter(etapa=etapa)
        if cliente := self.request.query_params.get("cliente"):
            qs = qs.filter(cliente__id=cliente)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        # Sin paginar por defecto: el tablero necesita todas las tarjetas
        if request.query_params.get("paginar") == "1":
            page = self.paginate_queryset(qs)
            if page is not None:
                return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return success_response(data=self.get_serializer(qs, many=True).data)

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Oportunidad creada.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class OportunidadDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = OportunidadSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = Oportunidad.objects.select_related("cliente", "responsable")

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        s = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Oportunidad actualizada.")
        return validation_error_response(s)

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return success_response(message="Oportunidad eliminada.")


# ── Interacciones (bitácora) ───────────────────────────────────────────────────
class InteraccionListCreateView(ListCreateAPIView):
    serializer_class = InteraccionSerializer
    permission_classes = [IsAdminOrPropietario]

    def get_queryset(self):
        qs = Interaccion.objects.select_related("usuario")
        if cliente := self.request.query_params.get("cliente"):
            qs = qs.filter(cliente__id=cliente)
        if oportunidad := self.request.query_params.get("oportunidad"):
            qs = qs.filter(oportunidad__id=oportunidad)
        return qs

    def list(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        if s.is_valid():
            s.save(usuario=request.user)
            return success_response(data=s.data, message="Interacción registrada.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


# ── Tareas / recordatorios ─────────────────────────────────────────────────────
class TareaListCreateView(ListCreateAPIView):
    serializer_class = TareaSerializer
    permission_classes = [IsAdminOrPropietario]

    def get_queryset(self):
        qs = Tarea.objects.select_related("cliente", "oportunidad", "responsable")
        estado = self.request.query_params.get("estado")
        if estado == "pendientes":
            qs = qs.filter(completada=False)
        elif estado == "completadas":
            qs = qs.filter(completada=True)
        if cliente := self.request.query_params.get("cliente"):
            qs = qs.filter(cliente__id=cliente)
        return qs

    def list(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Tarea creada.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class TareaDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = TareaSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = Tarea.objects.select_related("cliente", "oportunidad", "responsable")

    def update(self, request, *args, **kwargs):
        s = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Tarea actualizada.")
        return validation_error_response(s)

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return success_response(message="Tarea eliminada.")


# ── Ficha 360° del cliente ─────────────────────────────────────────────────────
class Cliente360View(APIView):
    """Vista unificada de un cliente: datos, oportunidades, cotizaciones,
    pedidos, interacciones y tareas — todo en una sola respuesta."""
    permission_classes = [IsAdminOrPropietario]

    def get(self, request, pk):
        from apps.clientes.serializers import ClienteSerializer
        from apps.cotizaciones.serializers import CotizacionSerializer
        from apps.pedidos.serializers import PedidoSerializer

        cliente = get_object_or_404(Cliente, pk=pk)
        cotizaciones = cliente.cotizaciones.all().order_by("-fecha_creacion")[:50]
        pedidos = cliente.pedidos.all().order_by("-fecha_creacion")[:50]
        oportunidades = cliente.oportunidades.select_related("responsable").all()
        interacciones = cliente.interacciones.select_related("usuario").all()[:100]
        tareas = cliente.tareas_crm.select_related("responsable").all()

        total_pedidos = sum((getattr(p, "total", 0) or 0) for p in pedidos)

        data = {
            "cliente": ClienteSerializer(cliente).data,
            "resumen": {
                "cotizaciones": len(cotizaciones),
                "pedidos": len(pedidos),
                "oportunidades_abiertas": oportunidades.exclude(etapa__in=["GANADO", "PERDIDO"]).count(),
                "valor_total_pedidos": str(total_pedidos),
            },
            "oportunidades": OportunidadSerializer(oportunidades, many=True).data,
            "cotizaciones": CotizacionSerializer(cotizaciones, many=True).data,
            "pedidos": PedidoSerializer(pedidos, many=True).data,
            "interacciones": InteraccionSerializer(interacciones, many=True).data,
            "tareas": TareaSerializer(tareas, many=True).data,
        }
        return success_response(data=data)


# ── Resumen del embudo (para dashboard/kpi) ────────────────────────────────────
class PipelineResumenView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def get(self, request):
        from django.db.models import Count, Sum
        filas = (
            Oportunidad.objects.values("etapa")
            .annotate(total=Count("id"), valor=Sum("valor_estimado"))
        )
        por_etapa = {f["etapa"]: {"total": f["total"], "valor": str(f["valor"] or 0)} for f in filas}
        return success_response(data={"por_etapa": por_etapa})
