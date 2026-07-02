import pytest
from django.urls import reverse
from django.core.cache import cache
from rest_framework.test import APIClient
from unittest.mock import patch


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


def attempt_login(client, ip="1.2.3.4"):
    url = reverse("v1:token_obtain_pair")
    client.defaults["REMOTE_ADDR"] = ip
    return client.post(url, {"email": "noexiste@test.com", "password": "bad"})


@pytest.mark.django_db
def test_5_intentos_fallidos_permiten_el_5to(client):
    for i in range(5):
        r = attempt_login(client)
        assert r.status_code != 429, f"Intento {i+1} no debería dar 429"


@pytest.mark.django_db
def test_6to_intento_retorna_429(client):
    for _ in range(5):
        attempt_login(client)
    r = attempt_login(client)
    assert r.status_code == 429


@pytest.mark.django_db
def test_header_retry_after_presente_en_respuesta_429(client):
    for _ in range(5):
        attempt_login(client)
    r = attempt_login(client)
    assert r.status_code == 429
    assert "Retry-After" in r or r.data.get("error", {}).get("code") == "LIMITE_LOGIN_EXCEDIDO"


@pytest.mark.django_db
def test_throttle_no_aplica_a_logins_exitosos(db, client):
    from apps.authentication.models import Usuario
    Usuario.objects.create_user(
        email="real@test.ec",
        nombre="Real",
        password="RealPass123!",
        rol="ADMIN",
    )
    url = reverse("v1:token_obtain_pair")
    client.defaults["REMOTE_ADDR"] = "9.9.9.9"
    for _ in range(3):
        r = client.post(url, {"email": "real@test.ec", "password": "RealPass123!"})
        assert r.status_code == 200
