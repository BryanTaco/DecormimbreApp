import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from model_bakery import baker


@pytest.fixture
def admin_client():
    from apps.authentication.models import Usuario
    user = Usuario.objects.create_user(
        email="admin_rep@decormimbre.ec",
        nombre="Admin Reportes",
        password="Admin1234!",
        rol="ADMIN",
    )
    client = APIClient()
    r = client.post(reverse("v1:token_obtain_pair"), {"email": "admin_rep@decormimbre.ec", "password": "Admin1234!"})
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['data']['access']}")
    return client


@pytest.fixture(autouse=True)
def clear_cache():
    from django.core.cache import cache
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_dashboard_kpis_retorna_200(admin_client):
    r = admin_client.get(reverse("v1:dashboard_kpis"))
    assert r.status_code == 200
    assert "ventas_mes_actual" in r.data["data"]
    assert "pedidos_activos" in r.data["data"]
    assert "alertas_stock_pendientes" in r.data["data"]
    assert "clientes_activos" in r.data["data"]


@pytest.mark.django_db
def test_dashboard_sin_autenticacion_retorna_401():
    client = APIClient()
    r = client.get(reverse("v1:dashboard_kpis"))
    assert r.status_code == 401


@pytest.mark.django_db
def test_dashboard_con_pedidos_refleja_datos(admin_client):
    from apps.clientes.models import Cliente
    from apps.pedidos.models import Pedido
    from apps.authentication.models import Usuario
    cliente = baker.make(Cliente, activo=True)
    usuario = baker.make(Usuario)
    baker.make(Pedido, cliente=cliente, estado="PENDIENTE", _quantity=3)
    r = admin_client.get(reverse("v1:dashboard_kpis"))
    data = r.data["data"]
    assert data["pedidos_activos"] >= 3
    assert data["clientes_activos"] >= 1


@pytest.mark.django_db
def test_excel_reporte_retorna_xlsx(admin_client):
    r = admin_client.get(reverse("v1:reporte_excel"))
    assert r.status_code == 200
    assert r["Content-Type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert "attachment" in r["Content-Disposition"]


@pytest.mark.django_db
def test_excel_reporte_con_fecha_invalida_retorna_400(admin_client):
    r = admin_client.get(reverse("v1:reporte_excel") + "?fecha_inicio=no-es-fecha")
    assert r.status_code == 400
