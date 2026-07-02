import os
from django.core.exceptions import ValidationError
from django.conf import settings

ALLOWED_MIME_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
}


def validate_image_file(file):
    """
    Valida un archivo de imagen verificando:
    1. Tamaño ≤ MAX_UPLOAD_SIZE (5 MB por defecto)
    2. MIME type real con python-magic (no confía en la extensión)
    3. Extensión permitida

    Raises:
        ValidationError con mensaje descriptivo si falla.
    """
    if file.size > settings.MAX_UPLOAD_SIZE:
        max_mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
        raise ValidationError(
            f"El archivo excede el tamaño máximo de {max_mb} MB. "
            f"Tamaño recibido: {file.size / (1024 * 1024):.2f} MB."
        )

    try:
        import magic
        mime_type = magic.from_buffer(file.read(2048), mime=True)
        file.seek(0)
    except ImportError:
        # Fallback si python-magic no está disponible (Windows sin libmagic)
        import imghdr
        header = file.read(2048)
        file.seek(0)
        img_type = imghdr.what(None, header)
        _mime_map = {"jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
        mime_type = _mime_map.get(img_type, "application/octet-stream")

    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(
            f"Tipo de archivo no permitido. MIME type detectado: '{mime_type}'. "
            f"Solo se aceptan: {', '.join(ALLOWED_MIME_TYPES.keys())}."
        )

    ext = os.path.splitext(file.name)[1].lower()
    allowed_extensions = ALLOWED_MIME_TYPES[mime_type]
    if ext not in allowed_extensions:
        raise ValidationError(
            f"La extensión '{ext}' no corresponde al tipo '{mime_type}'. "
            f"Extensiones válidas: {', '.join(allowed_extensions)}."
        )
