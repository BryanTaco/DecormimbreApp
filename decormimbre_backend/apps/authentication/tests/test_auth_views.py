"""Tests de vistas de autenticación: perfil, usuarios y logs de actividad."""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from model_bakery import baker


@pytest.fixture
def admin(db):
    from apps.authentication.models import Usuario
    return Usuario.objects.create_user(
        email="admin_view@decormimbre.ec",
        nombre="Admin Views",
        password="Admin1234!",
        rol="ADMIN",
    )


@pytest.fixture
def propietario(db):
    from apps.authentication.models import Usuario
    return Usuario.objects.create_user(
        email="prop_view@decormimbre.ec",
        nombre="Propietario",
        password="Prop1234!",
        rol="PROPIETARIO",
    )


@pytest.fixture
def api_admin(admin):
    client = APIClient()
    client.force_authenticate(user=admin)
    return client, admin


@pytest.fixture
def api_prop(propietario):
    client = APIClient()
    client.force_authenticate(user=propietario)
    return client, propietario


# ── /me ────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_me_retorna_perfil_del_usuario(api_admin):
    client, admin = api_admin
    r = client.get(reverse("v1:me"))
    assert r.status_code == 200
    assert r.data["data"]["email"] == admin.email


@pytest.mark.django_db
def test_me_actualiza_nombre(api_admin):
    client, admin = api_admin
    r = client.put(reverse("v1:me"), {"nombre": "Nuevo Nombre"})
    assert r.status_code == 200
    assert r.data["data"]["nombre"] == "Nuevo Nombre"


@pytest.mark.django_db
def test_me_actualizacion_invalida_retorna_error(api_admin):
    client, _ = api_admin
    r = client.put(reverse("v1:me"), {"email": "no-es-email"})
    assert r.status_code == 400


@pytest.mark.django_db
def test_me_sin_auth_retorna_401():
    client = APIClient()
    r = client.get(reverse("v1:me"))
    assert r.status_code == 401


# ── Gestión de usuarios (solo ADMIN) ──────────────────────────────────────────

@pytest.mark.django_db
def test_listar_usuarios_admin(api_admin):
    client, _ = api_admin
    r = client.get(reverse("v1:usuarios_list_create"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_usuarios_propietario_retorna_403(api_prop):
    client, _ = api_prop
    r = client.get(reverse("v1:usuarios_list_create"))
    assert r.status_code == 403


@pytest.mark.django_db
def test_crear_usuario_admin(api_admin):
    client, _ = api_admin
    r = client.post(reverse("v1:usuarios_list_create"), {
        "email": "nuevo@decormimbre.ec",
        "nombre": "Artesano Nuevo",
        "password": "Artesano123!",
        "rol": "ARTESANO",
    })
    assert r.status_code == 201
    assert r.data["data"]["email"] == "nuevo@decormimbre.ec"


@pytest.mark.django_db
def test_crear_usuario_invalido_retorna_error(api_admin):
    client, _ = api_admin
    r = client.post(reverse("v1:usuarios_list_create"), {"email": "no-es-email"})
    assert r.status_code == 400


@pytest.mark.django_db
def test_actualizar_usuario(api_admin):
    from apps.authentication.models import Usuario
    otro = Usuario.objects.create_user(
        email="otro@decormimbre.ec", nombre="Otro", password="Otro1234!", rol="ARTESANO"
    )
    client, _ = api_admin
    r = client.put(reverse("v1:usuarios_detail", kwargs={"pk": otro.pk}), {"nombre": "Editado"})
    assert r.status_code == 200
    assert r.data["data"]["nombre"] == "Editado"


@pytest.mark.django_db
def test_actualizar_usuario_inexistente_retorna_404(api_admin):
    import uuid
    client, _ = api_admin
    r = client.put(reverse("v1:usuarios_detail", kwargs={"pk": uuid.uuid4()}), {"nombre": "X"})
    assert r.status_code == 404


@pytest.mark.django_db
def test_actualizar_usuario_invalido(api_admin):
    from apps.authentication.models import Usuario
    otro = Usuario.objects.create_user(
        email="otro2@decormimbre.ec", nombre="Otro2", password="Otro1234!", rol="ARTESANO"
    )
    client, _ = api_admin
    r = client.put(reverse("v1:usuarios_detail", kwargs={"pk": otro.pk}), {"email": "no-email"})
    assert r.status_code == 400


@pytest.mark.django_db
def test_desactivar_usuario(api_admin):
    from apps.authentication.models import Usuario
    otro = Usuario.objects.create_user(
        email="baja@decormimbre.ec", nombre="Baja", password="Baja1234!", rol="ARTESANO"
    )
    client, _ = api_admin
    r = client.delete(reverse("v1:usuarios_detail", kwargs={"pk": otro.pk}))
    assert r.status_code == 200
    otro.refresh_from_db()
    assert not otro.activo


@pytest.mark.django_db
def test_no_puede_desactivar_propia_cuenta(api_admin):
    client, admin = api_admin
    r = client.delete(reverse("v1:usuarios_detail", kwargs={"pk": admin.pk}))
    assert r.status_code == 400


@pytest.mark.django_db
def test_desactivar_usuario_inexistente_retorna_404(api_admin):
    import uuid
    client, _ = api_admin
    r = client.delete(reverse("v1:usuarios_detail", kwargs={"pk": uuid.uuid4()}))
    assert r.status_code == 404


# ── Logs de actividad ──────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_listar_logs_retorna_200(api_admin):
    client, _ = api_admin
    r = client.get(reverse("v1:logs_actividad"))
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_logs_filtrar_por_modulo(api_admin):
    from apps.authentication.models import LogActividad
    baker.make(LogActividad, modulo="PEDIDOS", accion="CAMBIO_ESTADO")
    client, _ = api_admin
    r = client.get(reverse("v1:logs_actividad"), {"modulo": "PEDIDOS"})
    assert r.status_code == 200


@pytest.mark.django_db
def test_listar_logs_filtrar_por_accion(api_admin):
    from apps.authentication.models import LogActividad
    baker.make(LogActividad, modulo="PEDIDOS", accion="CREAR")
    client, _ = api_admin
    r = client.get(reverse("v1:logs_actividad"), {"accion": "CREAR"})
    assert r.status_code == 200


@pytest.mark.django_db
def test_logs_propietario_retorna_403(api_prop):
    client, _ = api_prop
    r = client.get(reverse("v1:logs_actividad"))
    assert r.status_code == 403
