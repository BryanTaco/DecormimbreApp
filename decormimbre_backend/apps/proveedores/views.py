from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from utils.responses import success_response, error_response, validation_error_response
from utils.pagination import StandardPagination
from apps.authentication.permissions import IsAdminOrPropietario
from .models import Proveedor, OrdenTrabajo
from .serializers import ProveedorSerializer, OrdenTrabajoSerializer


class ProveedorListCreateView(ListCreateAPIView):
    serializer_class = ProveedorSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Proveedor.objects.all()
        if self.request.query_params.get("solo_activos") == "1":
            qs = qs.filter(activo=True)
        if q := self.request.query_params.get("q"):
            qs = qs.filter(nombre__icontains=q)
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
            return success_response(data=s.data, message="Proveedor creado.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class ProveedorDetailView(RetrieveUpdateAPIView):
    serializer_class = ProveedorSerializer
    permission_classes = [IsAdminOrPropietario]

    def get_queryset(self):
        return Proveedor.objects.all()

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        s = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if s.is_valid():
            if not request.data.get("activo", True):
                s.save(activo=False)
                return success_response(data=s.data, message="Proveedor desactivado.")
            s.save()
            return success_response(data=s.data, message="Proveedor actualizado.")
        return validation_error_response(s)


class OrdenTrabajoListCreateView(ListCreateAPIView):
    serializer_class = OrdenTrabajoSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = OrdenTrabajo.objects.select_related("proveedor", "pedido")
        if estado := self.request.query_params.get("estado"):
            qs = qs.filter(estado=estado)
        if proveedor := self.request.query_params.get("proveedor"):
            qs = qs.filter(proveedor__id=proveedor)
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
            s.save(creado_por=request.user)
            return success_response(data=s.data, message="Orden de trabajo creada.", status_code=status.HTTP_201_CREATED)
        return validation_error_response(s)


class OrdenTrabajoDetailView(RetrieveUpdateAPIView):
    serializer_class = OrdenTrabajoSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = OrdenTrabajo.objects.select_related("proveedor", "pedido")

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        ot = self.get_object()
        s = self.get_serializer(ot, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Orden de trabajo actualizada.")
        return validation_error_response(s)
