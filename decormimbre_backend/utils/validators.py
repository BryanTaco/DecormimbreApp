from django.core.exceptions import ValidationError

PROVINCIAS_VALIDAS = set(range(1, 25)) | {30}


def validar_cedula_ecuatoriana(cedula: str) -> bool:
    """
    Valida una cédula ecuatoriana mediante el algoritmo Módulo 10.

    Pasos:
    1. Verificar exactamente 10 caracteres numéricos
    2. Código de provincia (dígitos 1-2) debe ser válido (01-24 o 30)
    3. Tercer dígito debe ser < 6 (persona natural)
    4. Aplicar coeficientes [2,1,2,1,2,1,2,1,2] a los primeros 9 dígitos
    5. Si producto >= 10, restarle 9
    6. Sumar todos los resultados parciales
    7. Calcular verificador = (10 - (suma % 10)) % 10
    8. Comparar con el décimo dígito
    """
    if not cedula or not cedula.isdigit() or len(cedula) != 10:
        raise ValidationError(
            f"La cédula debe tener exactamente 10 dígitos numéricos. "
            f"Se recibió: '{cedula}'"
        )

    digitos = [int(d) for d in cedula]

    provincia = digitos[0] * 10 + digitos[1]
    if provincia not in PROVINCIAS_VALIDAS:
        raise ValidationError(
            f"El código de provincia '{cedula[:2]}' no es válido. "
            f"Los códigos válidos son 01-24 y 30 (ecuatorianos en el exterior)."
        )

    if digitos[2] >= 6:
        raise ValidationError(
            f"El tercer dígito de la cédula debe ser menor a 6. "
            f"Se recibió: '{digitos[2]}'"
        )

    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    suma = 0
    for i, coef in enumerate(coeficientes):
        producto = digitos[i] * coef
        suma += producto - 9 if producto >= 10 else producto

    verificador_esperado = (10 - (suma % 10)) % 10

    if verificador_esperado != digitos[9]:
        raise ValidationError(
            f"La cédula '{cedula}' no es válida. "
            f"El dígito verificador no coincide."
        )

    return True


def validar_ruc_persona_natural(ruc: str) -> bool:
    """
    Valida RUC de persona natural ecuatoriana.
    Formato: cédula (10 dígitos) + '001' = 13 dígitos.
    """
    if not ruc or not ruc.isdigit() or len(ruc) != 13:
        raise ValidationError(
            "El RUC de persona natural debe tener 13 dígitos numéricos."
        )
    if not ruc.endswith("001"):
        raise ValidationError(
            "El RUC de persona natural debe terminar en '001'."
        )
    validar_cedula_ecuatoriana(ruc[:10])
    return True


def validar_cedula_o_ruc(valor: str, tipo: str) -> bool:
    """
    Punto de entrada unificado según tipo de cliente.
    tipo: 'NATURAL' → valida cédula (10 dígitos)
          'EMPRESA' → valida RUC persona natural (13 dígitos)
    """
    if tipo == "NATURAL":
        return validar_cedula_ecuatoriana(valor)
    elif tipo == "EMPRESA":
        return validar_ruc_persona_natural(valor)
    else:
        raise ValidationError(f"Tipo de cliente '{tipo}' no reconocido.")
