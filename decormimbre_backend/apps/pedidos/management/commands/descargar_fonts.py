"""
Descarga las fuentes DejaVuSans necesarias para que los PDFs soporten UTF-8
(tildes, ñ, caracteres especiales del español).

Uso:
    python manage.py descargar_fonts

Fuentes descargadas:
    utils/fonts/DejaVuSans.ttf
    utils/fonts/DejaVuSans-Bold.ttf
"""
import urllib.request
import zipfile
import io
from pathlib import Path
from django.core.management.base import BaseCommand

FONTS_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent / "utils" / "fonts"

DEJAVU_VERSION = "2.37"
DEJAVU_URL = (
    f"https://github.com/dejavu-fonts/dejavu-fonts/releases/download/"
    f"version_{DEJAVU_VERSION.replace('.', '_')}/"
    f"dejavu-fonts-ttf-{DEJAVU_VERSION}.zip"
)

ARCHIVOS_REQUERIDOS = {
    f"dejavu-fonts-ttf-{DEJAVU_VERSION}/ttf/DejaVuSans.ttf": "DejaVuSans.ttf",
    f"dejavu-fonts-ttf-{DEJAVU_VERSION}/ttf/DejaVuSans-Bold.ttf": "DejaVuSans-Bold.ttf",
}


class Command(BaseCommand):
    help = "Descarga las fuentes DejaVuSans para soporte UTF-8 en PDFs."

    def handle(self, *args, **options):
        FONTS_DIR.mkdir(parents=True, exist_ok=True)

        ya_existen = all((FONTS_DIR / dest).exists() for dest in ARCHIVOS_REQUERIDOS.values())
        if ya_existen:
            self.stdout.write(self.style.SUCCESS("Las fuentes ya están instaladas."))
            return

        self.stdout.write(f"Descargando fuentes DejaVu {DEJAVU_VERSION}...")
        self.stdout.write(f"URL: {DEJAVU_URL}")

        try:
            req = urllib.request.Request(
                DEJAVU_URL,
                headers={"User-Agent": "Decormimbre/1.0"},
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                zip_data = resp.read()
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error descargando: {e}"))
            self.stderr.write("Descarga manual:")
            self.stderr.write(f"  1. Visita {DEJAVU_URL}")
            self.stderr.write(f"  2. Extrae DejaVuSans.ttf y DejaVuSans-Bold.ttf")
            self.stderr.write(f"  3. Cópialos a: {FONTS_DIR}")
            return

        try:
            with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
                for src, dest in ARCHIVOS_REQUERIDOS.items():
                    destino = FONTS_DIR / dest
                    with zf.open(src) as fuente, open(destino, "wb") as archivo:
                        archivo.write(fuente.read())
                    self.stdout.write(f"  ✓ {dest}")
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error extrayendo ZIP: {e}"))
            return

        self.stdout.write(self.style.SUCCESS(
            f"Fuentes instaladas en {FONTS_DIR}. "
            "Los PDFs ahora soportan tildes y caracteres especiales."
        ))
