from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from utils.responses import success_response, error_response
from utils.pagination import StandardPagination
from apps.authentication.permissions import IsAdminOrPropietario
from .models import Cliente
from .serializers import ClienteSerializer


class ClienteListCreateView(ListCreateAPIView):
    serializer_class = ClienteSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Cliente.objects.select_related("creado_por")
        if nombre := self.request.query_params.get("nombre"):
            qs = qs.filter(nombre_completo__icontains=nombre)
        if cedula := self.request.query_params.get("cedula_ruc"):
            qs = qs.filter(cedula_ruc__icontains=cedula)
        if (activo := self.request.query_params.get("activo")) is not None:
            qs = qs.filter(activo=activo.lower() == "true")
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            instance = serializer.save()
            return success_response(
                data=ClienteSerializer(instance).data,
                message="Cliente registrado correctamente.",
                status_code=status.HTTP_201_CREATED,
            )
        errors = serializer.errors
        if "cedula_ruc" in errors:
            return error_response(
                "CEDULA_INVALIDA",
                str(errors["cedula_ruc"][0]),
                field="cedula_ruc",
            )
        return error_response("VALIDACION_ERROR", str(errors))

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return success_response(data=self.get_serializer(qs, many=True).data)


class ClienteDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ClienteSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = Cliente.objects.select_related("creado_por")

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(data=serializer.data, message="Cliente actualizado.")
        errors = serializer.errors
        if "cedula_ruc" in errors:
            return error_response("CEDULA_INVALIDA", str(errors["cedula_ruc"][0]), field="cedula_ruc")
        return error_response("VALIDACION_ERROR", str(errors))

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.activo = False
        instance.save()
        return success_response(message="Cliente desactivado.")


class ClientePedidosView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def get(self, request, pk):
        cliente = get_object_or_404(Cliente, pk=pk)
        from apps.pedidos.serializers import PedidoSerializer
        paginator = StandardPagination()
        qs = cliente.pedidos.all().order_by("-fecha_creacion")
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(PedidoSerializer(page, many=True).data)


class ClienteCotizacionesView(APIView):
    permission_classes = [IsAdminOrPropietario]

    def get(self, request, pk):
        cliente = get_object_or_404(Cliente, pk=pk)
        from apps.cotizaciones.serializers import CotizacionSerializer
        paginator = StandardPagination()
        qs = cliente.cotizaciones.all().order_by("-fecha_creacion")
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(CotizacionSerializer(page, many=True).data)
