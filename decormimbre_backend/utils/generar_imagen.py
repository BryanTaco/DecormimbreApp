"""
Generador de imágenes para Decormimbre usando Pollinations.ai (gratuito).

Uso desde consola:
    python utils/generar_imagen.py "silla de mimbre natural" --nombre silla_mimbre

Uso desde código:
    from utils.generar_imagen import generar_imagen
    path = generar_imagen("silla de mimbre artesanal", nombre_archivo="silla_01")
"""

import argparse
import os
import urllib.parse
import requests


MODELO_DEFAULT = "flux"
CARPETA_DEFAULT = "media/productos"


def generar_imagen(
    descripcion: str,
    nombre_archivo: str | None = None,
    carpeta: str = CARPETA_DEFAULT,
    ancho: int = 1024,
    alto: int = 1024,
    modelo: str = MODELO_DEFAULT,
) -> str:
    """
    Genera una imagen con Pollinations.ai y la guarda en disco.

    Args:
        descripcion: Descripción en español o inglés de la imagen.
        nombre_archivo: Nombre sin extensión. Si no se pone, se auto-genera.
        carpeta: Carpeta de destino relativa al proyecto.
        ancho / alto: Dimensiones en píxeles.
        modelo: 'flux' (realista) o 'turbo' (rápido).

    Returns:
        Ruta relativa del archivo guardado.
    """
    prompt_completo = (
        f"{descripcion}, artisanal Ecuadorian furniture, "
        "professional product photography, white studio background, "
        "soft lighting, high quality, sharp focus"
    )

    encoded = urllib.parse.quote(prompt_completo)
    url = (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={ancho}&height={alto}&model={modelo}&nologo=true"
    )

    headers = {"User-Agent": "Decormimbre/1.0"}
    response = requests.get(url, headers=headers, timeout=120)
    response.raise_for_status()

    os.makedirs(carpeta, exist_ok=True)

    if not nombre_archivo:
        slug = descripcion[:40].lower().replace(" ", "_")
        slug = "".join(c for c in slug if c.isalnum() or c == "_")
        nombre_archivo = slug

    ruta = os.path.join(carpeta, f"{nombre_archivo}.jpg")
    with open(ruta, "wb") as f:
        f.write(response.content)

    return ruta


def main():
    parser = argparse.ArgumentParser(description="Generador de imágenes Decormimbre")
    parser.add_argument("descripcion", help="Descripción de la imagen a generar")
    parser.add_argument("--nombre", "-n", help="Nombre del archivo (sin extensión)")
    parser.add_argument("--carpeta", "-c", default=CARPETA_DEFAULT, help="Carpeta de destino")
    parser.add_argument("--ancho", type=int, default=1024)
    parser.add_argument("--alto", type=int, default=1024)
    parser.add_argument("--modelo", default=MODELO_DEFAULT, choices=["flux", "turbo"])
    args = parser.parse_args()

    print(f"Generando: {args.descripcion}")
    ruta = generar_imagen(
        args.descripcion,
        nombre_archivo=args.nombre,
        carpeta=args.carpeta,
        ancho=args.ancho,
        alto=args.alto,
        modelo=args.modelo,
    )
    print(f"Guardado en: {ruta}")


if __name__ == "__main__":
    main()
