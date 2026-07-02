"""Tests de vistas del catálogo: categorías, productos y colores."""
import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from model_bakery import baker


@pytest.fixture
def admin(db):
    from apps.authentication.models import Usuario
    return Usuario.objects.create_user(
        email="admin_cat@decormimbre.ec",
        nombre="Admin Cat",
        password="Admin1234!",
        rol="ADMIN",
    )


@pytest.fixture
def api(admin):
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


@pytest.fixture
def categoria(db):
    from apps.catalogo.models import Categoria
    return baker.make(Categoria, nombre="Sillas", activo=True)


@pytest.fixture
def producto(db, categoria):
    from apps.catalogo.models import Producto
    return baker.make(Producto, categoria=categoria, activo=True, precio_base=Decimal("200.00"))


@pytest.fixture
def color(db):
    from apps.catalogo.models import Color
    return baker.make(Color, r=100, g=150, b=200, disponible=True)


# ── Categorías ─────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_categorias_es_publico():
    client = APIClient()
    r = client.get(reverse("v1:categorias_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_categorias_solo_activas(api, categoria):
    from apps.catalogo.models import Categoria
    baker.make(Categoria, nombre="Inactiva", activo=False)
    r = api.get(reverse("v1:categorias_list"))
    assert r.status_code == 200
    nombres = [c["nombre"] for c in r.data["data"]]
    assert "Sillas" in nombres
    assert "Inactiva" not in nombres


@pytest.mark.django_db
def test_crear_categoria(api):
    r = api.post(reverse("v1:categorias_list"), {"nombre": "Mesas", "descripcion": "Mesas artesanales"})
    assert r.status_code == 201
    assert r.data["data"]["nombre"] == "Mesas"


@pytest.mark.django_db
def test_crear_categoria_sin_auth_retorna_403():
    client = APIClient()
    r = client.post(reverse("v1:categorias_list"), {"nombre": "Sillas"})
    assert r.status_code in (401, 403)


@pytest.mark.django_db
def test_crear_categoria_invalida_retorna_error(api):
    r = api.post(reverse("v1:categorias_list"), {})
    assert r.status_code == 400


@pytest.mark.django_db
def test_detalle_categoria(api, categoria):
    r = api.get(reverse("v1:categorias_detail", kwargs={"pk": categoria.pk}))
    assert r.status_code == 200
    assert r.data["data"]["nombre"] == "Sillas"


@pytest.mark.django_db
def test_actualizar_categoria(api, categoria):
    r = api.put(
        reverse("v1:categorias_detail", kwargs={"pk": categoria.pk}),
        {"nombre": "Sillas Premium"},
    )
    assert r.status_code == 200
    assert r.data["data"]["nombre"] == "Sillas Premium"


@pytest.mark.django_db
def test_actualizar_categoria_invalida_retorna_error(api, categoria):
    # nombre con string vacío es inválido (required)
    r = api.put(
        reverse("v1:categorias_detail", kwargs={"pk": categoria.pk}),
        {"nombre": ""},
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_desactivar_categoria_soft_delete(api, categoria):
    r = api.delete(reverse("v1:categorias_detail", kwargs={"pk": categoria.pk}))
    assert r.status_code == 200
    categoria.refresh_from_db()
    assert not categoria.activo


# ── Productos ──────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_productos_retorna_200(api):
    r = api.get(reverse("v1:productos_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_productos_filtrar_por_categoria(api, producto, categoria):
    r = api.get(reverse("v1:productos_list"), {"categoria": str(categoria.pk)})
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_productos_filtrar_activos(api, producto):
    r = api.get(reverse("v1:productos_list"), {"activo": "true"})
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_productos_filtrar_personalizables(api, producto):
    r = api.get(reverse("v1:productos_list"), {"personalizable": "true"})
    assert r.status_code == 200


@pytest.mark.django_db
def test_crear_producto(api, categoria):
    r = api.post(reverse("v1:productos_list"), {
        "nombre": "Silla Clásica",
        "descripcion": "Silla de mimbre natural",
        "precio_base": "250.00",
        "stock_minimo": 2,
        "categoria": str(categoria.pk),
        "material": "MIMBRE",
    })
    assert r.status_code == 201
    assert r.data["data"]["nombre"] == "Silla Clásica"


@pytest.mark.django_db
def test_crear_producto_invalido(api):
    r = api.post(reverse("v1:productos_list"), {})
    assert r.status_code == 400


@pytest.mark.django_db
def test_detalle_producto(api, producto):
    r = api.get(reverse("v1:productos_detail", kwargs={"pk": producto.pk}))
    assert r.status_code == 200


@pytest.mark.django_db
def test_actualizar_producto(api, producto):
    r = api.put(
        reverse("v1:productos_detail", kwargs={"pk": producto.pk}),
        {"nombre": "Silla Mimbre Actualizada"},
    )
    assert r.status_code == 200


@pytest.mark.django_db
def test_actualizar_producto_invalido(api, producto):
    r = api.put(
        reverse("v1:productos_detail", kwargs={"pk": producto.pk}),
        {"precio_base": "no-es-numero"},
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_desactivar_producto_soft_delete(api, producto):
    r = api.delete(reverse("v1:productos_detail", kwargs={"pk": producto.pk}))
    assert r.status_code == 200
    producto.refresh_from_db()
    assert not producto.activo


# ── Colores ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_colores_es_publico():
    client = APIClient()
    r = client.get(reverse("v1:colores_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_colores_solo_disponibles(api, color):
    from apps.catalogo.models import Color
    baker.make(Color, r=0, g=0, b=0, disponible=False)
    r = api.get(reverse("v1:colores_list"))
    assert r.status_code == 200
    hexes = [c["hex"] for c in r.data["data"]]
    assert color.hex in hexes


@pytest.mark.django_db
def test_crear_color(api):
    r = api.post(reverse("v1:colores_list"), {"nombre": "Verde Mimbre", "r": 80, "g": 120, "b": 40})
    assert r.status_code == 201
    assert r.data["data"]["nombre"] == "Verde Mimbre"


@pytest.mark.django_db
def test_crear_color_invalido(api):
    r = api.post(reverse("v1:colores_list"), {"nombre": "Roto"})
    assert r.status_code == 400


@pytest.mark.django_db
def test_actualizar_color(api, color):
    r = api.put(
        reverse("v1:colores_detail", kwargs={"pk": color.pk}),
        {"nombre": "Azul Noche"},
    )
    assert r.status_code == 200
    assert r.data["data"]["nombre"] == "Azul Noche"


@pytest.mark.django_db
def test_actualizar_color_invalido(api, color):
    r = api.put(
        reverse("v1:colores_detail", kwargs={"pk": color.pk}),
        {"r": "no-es-entero"},
    )
    assert r.status_code == 400
