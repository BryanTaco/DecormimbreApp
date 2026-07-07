from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView, ListAPIView
from rest_framework.views import APIView
from utils.responses import success_response, error_response, validation_error_response
from utils.pagination import StandardPagination
from apps.authentication.permissions import IsAdminOrPropietario
from .models import MateriaPrima, Lote, MovimientoInventario, AlertaStock
from .serializers import (
    MateriaPrimaSerializer, LoteSerializer,
    MovimientoInventarioSerializer, AlertaStockSerializer,
)


class MateriaPrimaListCreateView(ListCreateAPIView):
    serializer_class = MateriaPrimaSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = MateriaPrima.objects.filter(activo=True)
        if self.request.query_params.get("stock_critico") == "true":
            from django.db.models import F
            qs = qs.filter(stock_actual__lte=F("stock_minimo"))
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return success_response(data=self.get_serializer(qs, many=True).data)

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Materia prima creada.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class MateriaPrimaDetailView(RetrieveUpdateAPIView):
    serializer_class = MateriaPrimaSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = MateriaPrima.objects.all()

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        s = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Materia prima actualizada.")
        return validation_error_response(s)


class LoteListCreateView(ListCreateAPIView):
    serializer_class = LoteSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Lote.objects.select_related("materia_prima", "proveedor")
        if mp := self.request.query_params.get("materia_prima"):
            qs = qs.filter(materia_prima__id=mp)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return success_response(data=self.get_serializer(qs, many=True).data)

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data, context={"request": request})
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Lote registrado.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class MovimientoListView(ListAPIView):
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination
    queryset = MovimientoInventario.objects.select_related("materia_prima", "usuario")

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return success_response(data=self.get_serializer(qs, many=True).data)


class AjusteCreateView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def post(self, request):
        data = request.data.copy()
        if "tipo" not in data:
            data["tipo"] = "AJUSTE_POSITIVO"
        s = MovimientoInventarioSerializer(data=data, context={"request": request})
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Ajuste registrado.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class AlertaStockListView(ListAPIView):
    serializer_class = AlertaStockSerializer
    permission_classes = [IsAdminOrPropietario]

    def get_queryset(self):
        return AlertaStock.objects.filter(revisada=False).select_related("materia_prima")

    def list(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_queryset(), many=True).data)


class AlertaStockRevisarView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def put(self, request, pk):
        try:
            alerta = AlertaStock.objects.get(pk=pk)
        except AlertaStock.DoesNotExist:
            return error_response("RECURSO_NO_ENCONTRADO", "Alerta no encontrada.", status_code=404)
        alerta.revisada = True
        alerta.save()
        return success_response(message="Alerta marcada como revisada.")
