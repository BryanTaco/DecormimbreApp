from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from utils.responses import success_response, error_response
from utils.pagination import StandardPagination
from apps.authentication.permissions import IsAdminOrPropietario
from .models import Categoria, Producto, Color
from .serializers import CategoriaSerializer, ProductoSerializer, ColorSerializer


class CategoriaListCreateView(ListCreateAPIView):
    serializer_class = CategoriaSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminOrPropietario()]

    def get_queryset(self):
        return Categoria.objects.filter(activo=True)

    def list(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(data=serializer.data, message="Categoría creada.", status_code=status.HTTP_201_CREATED)
        return error_response("VALIDACION_ERROR", str(serializer.errors))


class CategoriaDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = Categoria.objects.all()

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        s = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Categoría actualizada.")
        return error_response("VALIDACION_ERROR", str(s.errors))

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.activo = False
        obj.save()
        return success_response(message="Categoría desactivada.")


class ProductoListCreateView(ListCreateAPIView):
    serializer_class = ProductoSerializer
    permission_classes = [IsAdminOrPropietario]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Producto.objects.select_related("categoria")
        if cat := self.request.query_params.get("categoria"):
            qs = qs.filter(categoria__id=cat)
        if (activo := self.request.query_params.get("activo")) is not None:
            qs = qs.filter(activo=activo.lower() == "true")
        if self.request.query_params.get("personalizable") == "true":
            qs = qs.filter(personalizable=True)
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
            return success_response(data=s.data, message="Producto creado.", status_code=status.HTTP_201_CREATED)
        return error_response("VALIDACION_ERROR", str(s.errors))


class ProductoDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ProductoSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = Producto.objects.select_related("categoria")

    def retrieve(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        s = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Producto actualizado.")
        return error_response("VALIDACION_ERROR", str(s.errors))

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.activo = False
        obj.save()
        return success_response(message="Producto desactivado.")


class ColorListCreateView(ListCreateAPIView):
    serializer_class = ColorSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminOrPropietario()]

    def get_queryset(self):
        return Color.objects.filter(disponible=True)

    def list(self, request, *args, **kwargs):
        return success_response(data=self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Color creado.", status_code=status.HTTP_201_CREATED)
        return error_response("VALIDACION_ERROR", str(s.errors))


class ColorDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = ColorSerializer
    permission_classes = [IsAdminOrPropietario]
    queryset = Color.objects.all()

    def update(self, request, *args, **kwargs):
        s = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return success_response(data=s.data, message="Color actualizado.")
        return error_response("VALIDACION_ERROR", str(s.errors))
