from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import exception_handler


def success_response(data=None, message="Operación exitosa", status_code=status.HTTP_200_OK, meta=None):
    body = {"success": True, "data": data, "message": message}
    if meta is not None:
        body["meta"] = meta
    return Response(body, status=status_code)


def error_response(code, message, field=None, status_code=status.HTTP_400_BAD_REQUEST):
    error = {"code": code, "message": message}
    if field:
        error["field"] = field
    return Response({"success": False, "error": error}, status=status_code)


def validation_error_response(serializer, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Construye una respuesta de error de validación limpia a partir de un serializer.

    Extrae el primer campo con error y su primer mensaje, sin exponer la
    representación interna del dict de errores de DRF (ErrorDetail/codes).
    """
    errors = serializer.errors
    field = None
    message = "Datos inválidos."
    if isinstance(errors, dict) and errors:
        field, messages = next(iter(errors.items()))
        if isinstance(messages, (list, tuple)) and messages:
            message = str(messages[0])
        else:
            message = str(messages)
        if field == "non_field_errors":
            field = None
    return error_response(
        "VALIDACION_ERROR",
        message,
        field=field,
        status_code=status_code,
    )


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    from rest_framework.exceptions import (
        AuthenticationFailed,
        NotAuthenticated,
        PermissionDenied,
        Throttled,
        ValidationError,
        NotFound,
    )

    if isinstance(exc, NotAuthenticated):
        return error_response(
            "TOKEN_EXPIRADO",
            "Autenticación requerida. Proporcione un token válido.",
            status_code=response.status_code,
        )
    if isinstance(exc, AuthenticationFailed):
        return error_response(
            "CREDENCIALES_INVALIDAS",
            "Credenciales inválidas.",
            status_code=response.status_code,
        )
    if isinstance(exc, PermissionDenied):
        return error_response(
            "PERMISO_DENEGADO",
            "No tiene permiso para realizar esta acción.",
            status_code=response.status_code,
        )
    if isinstance(exc, Throttled):
        wait = int(exc.wait) if exc.wait else 900
        return error_response(
            "LIMITE_LOGIN_EXCEDIDO",
            f"Demasiados intentos. Intente de nuevo en {wait} segundos.",
            status_code=response.status_code,
        )
    if isinstance(exc, NotFound):
        return error_response(
            "RECURSO_NO_ENCONTRADO",
            "El recurso solicitado no existe.",
            status_code=response.status_code,
        )
    if isinstance(exc, ValidationError):
        errors = response.data
        if isinstance(errors, dict):
            for field, messages in errors.items():
                msg = messages[0] if isinstance(messages, list) else str(messages)
                return error_response(
                    "VALIDACION_ERROR",
                    str(msg),
                    field=field if field != "non_field_errors" else None,
                    status_code=response.status_code,
                )
        return error_response(
            "VALIDACION_ERROR",
            str(errors),
            status_code=response.status_code,
        )
    return response
