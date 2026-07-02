"""Tests de vistas de inventario: materias primas, lotes, movimientos y alertas."""
import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from model_bakery import baker


@pytest.fixture
def admin(db):
    from apps.authentication.models import Usuario
    return Usuario.objects.create_user(
        email="admin_inv@decormimbre.ec",
        nombre="Admin Inventario",
        password="Admin1234!",
        rol="ADMIN",
    )


@pytest.fixture
def api(admin):
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


@pytest.fixture
def materia(db):
    from apps.inventario.models import MateriaPrima
    return baker.make(
        MateriaPrima,
        nombre="Mimbre natural",
        unidad="ROLLO",
        stock_actual=Decimal("50.000"),
        stock_minimo=Decimal("10.000"),
        costo_unitario=Decimal("25.00"),
        activo=True,
    )


# ── Materias primas ────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_materias_retorna_200(api):
    r = api.get(reverse("v1:materias_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_materias_filtrar_stock_critico(api, materia):
    from apps.inventario.models import MateriaPrima
    critica = baker.make(
        MateriaPrima, unidad="KG",
        stock_actual=Decimal("2.000"), stock_minimo=Decimal("10.000"),
        costo_unitario=Decimal("5.00"), activo=True,
    )
    r = api.get(reverse("v1:materias_list"), {"stock_critico": "true"})
    assert r.status_code == 200
    ids = [m["id"] for m in r.data["data"]]
    assert str(critica.pk) in ids
    assert str(materia.pk) not in ids


@pytest.mark.django_db
def test_crear_materia_prima(api):
    r = api.post(reverse("v1:materias_list"), {
        "nombre": "Polialuminio",
        "unidad": "PLANCHA",
        "stock_actual": "0.000",
        "stock_minimo": "5.000",
        "costo_unitario": "8.50",
    })
    assert r.status_code == 201
    assert r.data["data"]["nombre"] == "Polialuminio"


@pytest.mark.django_db
def test_crear_materia_prima_invalida(api):
    r = api.post(reverse("v1:materias_list"), {"nombre": "Sin unidad"})
    assert r.status_code == 400


@pytest.mark.django_db
def test_detalle_materia_prima(api, materia):
    r = api.get(reverse("v1:materias_detail", kwargs={"pk": materia.pk}))
    assert r.status_code == 200
    assert r.data["data"]["nombre"] == materia.nombre


@pytest.mark.django_db
def test_actualizar_materia_prima(api, materia):
    r = api.put(
        reverse("v1:materias_detail", kwargs={"pk": materia.pk}),
        {"stock_minimo": "15.000"},
    )
    assert r.status_code == 200
    materia.refresh_from_db()
    assert materia.stock_minimo == Decimal("15.000")


@pytest.mark.django_db
def test_actualizar_materia_prima_invalida(api, materia):
    r = api.put(
        reverse("v1:materias_detail", kwargs={"pk": materia.pk}),
        {"costo_unitario": "no-es-numero"},
    )
    assert r.status_code == 400


# ── Lotes ──────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_lotes_retorna_200(api):
    r = api.get(reverse("v1:lotes_list"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_lotes_filtrar_por_materia(api, materia):
    r = api.get(reverse("v1:lotes_list"), {"materia_prima": str(materia.pk)})
    assert r.status_code == 200


@pytest.mark.django_db
def test_crear_lote_incrementa_stock(api, materia):
    stock_inicial = materia.stock_actual
    r = api.post(reverse("v1:lotes_list"), {
        "materia_prima": str(materia.pk),
        "numero_lote": "LOT-001",
        "cantidad_inicial": "20.000",
        "cantidad_disponible": "20.000",
        "costo_unitario": "25.00",
        "fecha_recepcion": "2026-07-01",
    })
    assert r.status_code == 201
    materia.refresh_from_db()
    assert materia.stock_actual == stock_inicial + Decimal("20.000")


@pytest.mark.django_db
def test_crear_lote_invalido(api):
    r = api.post(reverse("v1:lotes_list"), {"numero_lote": "SIN-MATERIA"})
    assert r.status_code == 400


# ── Movimientos ────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_movimientos_retorna_200(api):
    r = api.get(reverse("v1:movimientos_list"))
    assert r.status_code == 200


# ── Ajustes de inventario ──────────────────────────────────────────────────────

@pytest.mark.django_db
def test_ajuste_positivo_incrementa_stock(api, materia):
    stock_inicial = materia.stock_actual
    r = api.post(reverse("v1:ajustes_create"), {
        "materia_prima": str(materia.pk),
        "tipo": "AJUSTE_POSITIVO",
        "cantidad": "10.000",
        "justificacion": "Corrección de inventario físico",
    })
    assert r.status_code == 201
    materia.refresh_from_db()
    assert materia.stock_actual == stock_inicial + Decimal("10.000")


@pytest.mark.django_db
def test_ajuste_sin_justificacion_retorna_error(api, materia):
    r = api.post(reverse("v1:ajustes_create"), {
        "materia_prima": str(materia.pk),
        "tipo": "AJUSTE_POSITIVO",
        "cantidad": "5.000",
    })
    assert r.status_code == 400


@pytest.mark.django_db
def test_ajuste_sin_tipo_usa_ajuste_positivo_por_defecto(api, materia):
    """La vista inyecta AJUSTE_POSITIVO cuando no se envía tipo; requiere justificacion."""
    r = api.post(reverse("v1:ajustes_create"), {
        "materia_prima": str(materia.pk),
        "cantidad": "5.000",
        "justificacion": "Corrección sin tipo explícito",
    })
    assert r.status_code == 201


@pytest.mark.django_db
def test_ajuste_negativo_reduce_stock(api, materia):
    stock_inicial = materia.stock_actual
    r = api.post(reverse("v1:ajustes_create"), {
        "materia_prima": str(materia.pk),
        "tipo": "AJUSTE_NEGATIVO",
        "cantidad": "5.000",
        "justificacion": "Merma",
    })
    assert r.status_code == 201
    materia.refresh_from_db()
    assert materia.stock_actual == stock_inicial - Decimal("5.000")


# ── Alertas de stock ───────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_alertas_stock_retorna_200(api):
    r = api.get(reverse("v1:alertas_stock"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_marcar_alerta_revisada(api, materia):
    from apps.inventario.models import AlertaStock
    alerta = baker.make(AlertaStock, materia_prima=materia, revisada=False, stock_al_momento=Decimal("2.000"))
    r = api.put(reverse("v1:alertas_revisar", kwargs={"pk": alerta.pk}))
    assert r.status_code == 200
    alerta.refresh_from_db()
    assert alerta.revisada


@pytest.mark.django_db
def test_marcar_alerta_inexistente_retorna_404(api):
    r = api.put(reverse("v1:alertas_revisar", kwargs={"pk": 99999}))
    assert r.status_code == 404


# ── Sin autenticación ─────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_materias_sin_auth_retorna_401():
    client = APIClient()
    r = client.get(reverse("v1:materias_list"))
    assert r.status_code == 401
