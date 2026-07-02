import pytest
from django.core.exceptions import ValidationError
from apps.clientes.validators import validar_cedula_ecuatoriana, validar_ruc_persona_natural

CEDULAS_VALIDAS = [
    "1710034065",  # Pichincha — verificado con Módulo 10
    "1750777516",  # Pichincha — verificado con Módulo 10
    "0900168568",  # Guayas — verificado con Módulo 10
    "0200568210",  # Bolívar — verificado con Módulo 10
]

CEDULAS_INVALIDAS = [
    ("0023456789", "Provincia 00 no existe"),
    ("2523456789", "Provincia 25 no existe"),
    ("9923456789", "Provincia 99 no existe"),
    ("1234567891", "Dígito verificador incorrecto"),
    ("171003406",  "Solo 9 dígitos"),
    ("17100340655", "11 dígitos"),
    ("abcdefghij", "Caracteres no numéricos"),
    ("",           "Vacío"),
    ("0000000000", "Todos ceros"),
    ("1790034065", "Tercer dígito >= 6"),
]


@pytest.mark.parametrize("cedula", CEDULAS_VALIDAS)
def test_cedulas_validas_pasan_validacion(cedula):
    assert validar_cedula_ecuatoriana(cedula) is True


@pytest.mark.parametrize("cedula,razon", CEDULAS_INVALIDAS)
def test_cedulas_invalidas_lanzan_validation_error(cedula, razon):
    with pytest.raises(ValidationError):
        validar_cedula_ecuatoriana(cedula)


def test_ruc_persona_natural_valido():
    assert validar_ruc_persona_natural("1710034065001") is True


def test_ruc_sin_sufijo_001_es_invalido():
    with pytest.raises(ValidationError):
        validar_ruc_persona_natural("1710034065002")


def test_ruc_con_cedula_invalida_es_rechazado():
    with pytest.raises(ValidationError):
        validar_ruc_persona_natural("1234567891001")
