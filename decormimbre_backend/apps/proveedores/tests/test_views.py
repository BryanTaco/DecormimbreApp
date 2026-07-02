"""Tests de vistas de proveedores y órdenes de trabajo."""
import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from model_bakery import baker


@pytest.fixture
def admin(db):
    from apps.authentication.models import Usuario
    return Usuario.objects.create_user(
        email="admin_prov@decormimbre.ec",
        nombre="Admin Prov",
        password="Admin1234!",
        rol="ADMIN",
    )


@pytest.fixture
def api(admin):
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


@pytest.fixture
def proveedor(db):
    from apps.proveedores.models import Proveedor
    return baker.make(Proveedor, nombre="Fábrica Tetrapack", ruc="1790012345001", activo=True)


@pytest.fixture
def orden(db, proveedor, admin):
    from apps.proveedores.models import OrdenTrabajo
    return baker.make(OrdenTrabajo, proveedor=proveedor, estado="BORRADOR", monto_acordado=Decimal("500.00"))


# ── Proveedores ────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_proveedores_retorna_200(api):
    r = api.get(reverse("v1:proveedores_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_proveedores_filtrar_solo_activos(api, proveedor):
    from apps.proveedores.models import Proveedor
    baker.make(Proveedor, ruc="0990012345001", activo=False)
    r = api.get(reverse("v1:proveedores_list"), {"solo_activos": "1"})
    assert r.status_code == 200
    nombres = [p["nombre"] for p in r.data["data"]]
    assert "Fábrica Tetrapack" in nombres


@pytest.mark.django_db
def test_listar_proveedores_busqueda_por_nombre(api, proveedor):
    r = api.get(reverse("v1:proveedores_list"), {"q": "Tetrapack"})
    assert r.status_code == 200
    assert len(r.data["data"]) >= 1


@pytest.mark.django_db
def test_crear_proveedor(api):
    r = api.post(reverse("v1:proveedores_list"), {
        "nombre": "Mimbre del Ecuador",
        "ruc": "0102345678",
        "tipo": "MATERIA_PRIMA",
    })
    assert r.status_code == 201
    assert r.data["data"]["nombre"] == "Mimbre del Ecuador"


@pytest.mark.django_db
def test_crear_proveedor_ruc_invalido(api):
    r = api.post(reverse("v1:proveedores_list"), {
        "nombre": "Test",
        "ruc": "ABC",
        "tipo": "MATERIA_PRIMA",
    })
    assert r.status_code == 400


@pytest.mark.django_db
def test_crear_proveedor_sin_datos_retorna_error(api):
    r = api.post(reverse("v1:proveedores_list"), {})
    assert r.status_code == 400


@pytest.mark.django_db
def test_detalle_proveedor_retorna_200(api, proveedor):
    r = api.get(reverse("v1:proveedores_detail", kwargs={"pk": proveedor.pk}))
    assert r.status_code == 200
    assert r.data["data"]["nombre"] == proveedor.nombre


@pytest.mark.django_db
def test_actualizar_proveedor(api, proveedor):
    r = api.put(
        reverse("v1:proveedores_detail", kwargs={"pk": proveedor.pk}),
        {"contacto_nombre": "Juan Fábrica"},
    )
    assert r.status_code == 200
    assert r.data["data"]["contacto_nombre"] == "Juan Fábrica"


@pytest.mark.django_db
def test_desactivar_proveedor(api, proveedor):
    r = api.put(
        reverse("v1:proveedores_detail", kwargs={"pk": proveedor.pk}),
        {"activo": False},
    )
    assert r.status_code == 200
    proveedor.refresh_from_db()
    assert not proveedor.activo


@pytest.mark.django_db
def test_actualizar_proveedor_invalido(api, proveedor):
    r = api.put(
        reverse("v1:proveedores_detail", kwargs={"pk": proveedor.pk}),
        {"ruc": "INVALIDO"},
    )
    assert r.status_code == 400


# ── Órdenes de trabajo ─────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_ordenes_retorna_200(api):
    r = api.get(reverse("v1:ordenes_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_ordenes_filtrar_por_estado(api, orden):
    r = api.get(reverse("v1:ordenes_list"), {"estado": "BORRADOR"})
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_ordenes_filtrar_por_proveedor(api, orden, proveedor):
    r = api.get(reverse("v1:ordenes_list"), {"proveedor": str(proveedor.pk)})
    assert r.status_code == 200


@pytest.mark.django_db
def test_crear_orden_de_trabajo(api, proveedor):
    r = api.post(reverse("v1:ordenes_list"), {
        "proveedor": str(proveedor.pk),
        "descripcion": "Compra de planchas de polialuminio",
        "monto_acordado": "350.00",
        "estado": "BORRADOR",
    })
    assert r.status_code == 201


@pytest.mark.django_db
def test_crear_orden_invalida(api):
    r = api.post(reverse("v1:ordenes_list"), {})
    assert r.status_code == 400


@pytest.mark.django_db
def test_detalle_orden_retorna_200(api, orden):
    r = api.get(reverse("v1:ordenes_detail", kwargs={"pk": orden.pk}))
    assert r.status_code == 200
    assert r.data["data"]["numero"] == orden.numero


@pytest.mark.django_db
def test_actualizar_orden(api, orden):
    r = api.put(
        reverse("v1:ordenes_detail", kwargs={"pk": orden.pk}),
        {"estado": "ENVIADA"},
    )
    assert r.status_code == 200
    orden.refresh_from_db()
    assert orden.estado == "ENVIADA"


@pytest.mark.django_db
def test_actualizar_orden_invalida(api, orden):
    r = api.put(
        reverse("v1:ordenes_detail", kwargs={"pk": orden.pk}),
        {"monto_acordado": "no-es-numero"},
    )
    assert r.status_code == 400


# ── Sin autenticación ─────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_proveedores_sin_auth_retorna_401():
    client = APIClient()
    r = client.get(reverse("v1:proveedores_list"))
    assert r.status_code == 401
