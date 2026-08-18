"""
Seguridad — Evidencia de la configuración real de hashing de contraseñas.

El documento afirma que las contraseñas se protegen con bcrypt (SHA-256) y un
factor de coste de 12. Estas pruebas verifican esa configuración contra el
código real, de modo que la afirmación sea comprobable y no un dato declarado
sin respaldo.
"""
import pytest
from django.conf import settings
from django.contrib.auth.hashers import get_hasher, identify_hasher


def test_hasher_activo_es_bcrypt_sha256():
    """El primer hasher configurado (el que se usa al crear contraseñas) es BCryptSHA256."""
    hasher_activo = settings.PASSWORD_HASHERS[0]
    assert hasher_activo == "django.contrib.auth.hashers.BCryptSHA256PasswordHasher"


def test_factor_de_coste_bcrypt_es_12():
    """El factor de coste (rounds) del hasher activo es 12."""
    hasher = get_hasher("default")
    assert hasher.algorithm == "bcrypt_sha256"
    assert hasher.rounds == 12


@pytest.mark.django_db
def test_contrasena_se_almacena_hasheada_con_bcrypt():
    """Al crear un usuario, la contraseña se guarda hasheada con bcrypt_sha256,
    nunca en texto plano."""
    from apps.authentication.models import Usuario

    plana = "ClaveSegura123!"
    usuario = Usuario.objects.create_user(
        email="hash_test@decormimbre.ec",
        nombre="Hash Test",
        password=plana,
        rol="ADMIN",
    )
    # No se almacena en texto plano.
    assert usuario.password != plana
    # El hash corresponde al algoritmo bcrypt_sha256.
    assert usuario.password.startswith("bcrypt_sha256$")
    assert identify_hasher(usuario.password).algorithm == "bcrypt_sha256"
    # La verificación funciona en ambos sentidos.
    assert usuario.check_password(plana) is True
    assert usuario.check_password("otra-clave") is False
