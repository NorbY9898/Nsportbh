"""Compose the deterministic website backnumber onto approved photographic bases."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PAYLOAD = "NSPORT|FRJ|NAME=POPESCU|COUNTRY=ROU|SIZE=30x30"
BLUE = (36, 68, 132, 232)
ASSETS = [
    ("assets/images/hero/hero-judoka-popescu-v3-base.png", "assets/images/hero/hero-judoka-popescu-v4.png", [(1127, 296), (1412, 302), (1418, 541), (1133, 541)]),
    ("assets/images/product/backnumber-studio-v3-base.png", "assets/images/product/backnumber-studio-v4.png", [(301, 178), (1294, 252), (1294, 873), (232, 784)]),
    ("assets/images/story/judogi-alb-v3-base.png", "assets/images/story/judogi-alb-v4.png", [(505, 412), (832, 420), (837, 709), (521, 706)]),
    ("assets/images/story/judogi-albastru-v3-base.png", "assets/images/story/judogi-albastru-v4.png", [(606, 428), (940, 442), (940, 736), (614, 730)]),
    ("assets/images/story/detaliu-backnumber-v3-base.png", "assets/images/story/detaliu-backnumber-v4.png", [(551, 218), (1455, 347), (1454, 915), (484, 790)]),
    ("assets/images/story/spre-tatami-v3-base.png", "assets/images/story/spre-tatami-v4.png", [(768, 190), (934, 195), (930, 349), (770, 343)]),
    ("assets/images/story/actiune-judo-v3-base.png", "assets/images/story/actiune-judo-v4.png", [(855, 193), (1005, 154), (1077, 286), (920, 336)]),
]


def load_qr_matrix() -> list[list[bool]]:
    target = ROOT / "assets/images/product/popescu-rou-30x30-qr.json"
    subprocess.run(
        ["node", str(ROOT / "scripts/export-qr-matrix.mjs"), PAYLOAD, str(target)],
        check=True,
        cwd=ROOT,
    )
    matrix = json.loads(target.read_text(encoding="utf-8"))
    target.unlink()
    return matrix


def create_frjudo_logo() -> Image.Image:
    source = Image.open(ROOT / "assets/images/frjudo/fr-judo-logo-original.png").convert("RGB")
    difference = ImageChops.difference(source, Image.new("RGB", source.size, "white")).convert("L")
    alpha = difference.point(lambda value: 0 if value < 8 else min(255, value * 4))
    logo = source.convert("RGBA")
    logo.putalpha(alpha)
    output = ROOT / "assets/images/frjudo/fr-judo-logo-transparent.png"
    logo.save(output, optimize=True)
    return logo


def font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("C:/Windows/Fonts/Arial.ttf"),
    ]
    path = next((candidate for candidate in candidates if candidate.exists()), None)
    if not path:
        raise FileNotFoundError("A bold Arial-compatible font is required for asset composition.")
    return ImageFont.truetype(str(path), size=size)


def fitted_font(draw: ImageDraw.ImageDraw, text: str, maximum: int, width: int) -> ImageFont.FreeTypeFont:
    size = maximum
    while size > 8:
        candidate = font(size)
        if draw.textbbox((0, 0), text, font=candidate)[2] <= width:
            return candidate
        size -= 2
    return font(8)


def backnumber_overlay(matrix: list[list[bool]], frjudo_logo: Image.Image) -> Image.Image:
    side = 1000
    overlay = Image.new("RGBA", (side, side), (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    top = [(40, 75)]
    for x in range(40, 961, 20):
        normalized = (x - 500) / 460
        top.append((x, int(44 + 31 * normalized * normalized)))
    panel = top + [(940, 320), (60, 320)]
    draw.polygon(panel, fill=BLUE)

    name_font = fitted_font(draw, "POPESCU", 185, 800)
    draw.text((500, 190), "POPESCU", font=name_font, fill=(255, 255, 255, 238), anchor="mm")

    # Zone 2 is deliberately independent: the country code owns the middle row.
    code_font = fitted_font(draw, "ROU", 305, 650)
    draw.text((500, 555), "ROU", font=code_font, fill=(36, 68, 132, 238), anchor="mm")

    quiet = 4
    count = len(matrix) + quiet * 2
    qr = Image.new("RGBA", (count, count), (255, 255, 255, 0))
    qr_pixels = qr.load()
    for y, row in enumerate(matrix):
        for x, dark in enumerate(row):
            if dark:
                qr_pixels[x + quiet, y + quiet] = (15, 15, 15, 238)
    qr = qr.resize((88, 88), Image.Resampling.NEAREST)
    overlay.alpha_composite(qr, (78, 805))

    logo = frjudo_logo.copy()
    logo.thumbnail((120, 88), Image.Resampling.LANCZOS)
    overlay.alpha_composite(logo, (802 + (120 - logo.width) // 2, 805 + (88 - logo.height) // 2))
    return overlay


def integrate_print(base: Image.Image, warped: Image.Image) -> Image.Image:
    """Blend the complete warped artwork into the photographed textile surface."""
    base_rgb = np.asarray(base.convert("RGB"), dtype=np.float32)
    ink_rgb = np.asarray(warped.convert("RGB"), dtype=np.float32)
    alpha = np.asarray(warped.getchannel("A"), dtype=np.float32) / 255.0
    luminance = np.asarray(base.convert("L"), dtype=np.float32) / 255.0
    soft_luminance = np.asarray(
        base.convert("L").filter(ImageFilter.GaussianBlur(radius=4)), dtype=np.float32
    ) / 255.0
    fabric_detail = np.clip((luminance + 0.04) / (soft_luminance + 0.04), 0.86, 1.12)
    scene_light = np.clip(0.80 + luminance * 0.25, 0.82, 1.04)
    printed = np.clip(ink_rgb * (fabric_detail * scene_light)[..., None], 0, 255)
    effective_alpha = (alpha * 0.92)[..., None]
    result = base_rgb * (1.0 - effective_alpha) + printed * effective_alpha
    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8), "RGB")


def perspective_coefficients(source, destination):
    equations = []
    values = []
    for (source_x, source_y), (dest_x, dest_y) in zip(source, destination):
        equations.append([dest_x, dest_y, 1, 0, 0, 0, -source_x * dest_x, -source_x * dest_y])
        equations.append([0, 0, 0, dest_x, dest_y, 1, -source_y * dest_x, -source_y * dest_y])
        values.extend([source_x, source_y])
    return np.linalg.solve(np.asarray(equations, dtype=float), np.asarray(values, dtype=float))


def compose(base_path: Path, output_path: Path, quad, overlay: Image.Image) -> None:
    base = Image.open(base_path).convert("RGBA")
    source = [(0, 0), (overlay.width - 1, 0), (overlay.width - 1, overlay.height - 1), (0, overlay.height - 1)]
    coefficients = perspective_coefficients(source, quad)
    warped = overlay.transform(
        base.size,
        Image.Transform.PERSPECTIVE,
        coefficients,
        resample=Image.Resampling.BICUBIC,
    )
    result = integrate_print(base, warped)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.save(output_path, optimize=True)
    result.save(output_path.with_suffix(".webp"), "WEBP", quality=88, method=6)
    if "hero" in output_path.parts:
        width = 960
        height = round(result.height * width / result.width)
        result.resize((width, height), Image.Resampling.LANCZOS).save(
            output_path.with_name(f"{output_path.stem}-960.webp"), "WEBP", quality=86, method=6
        )


def main() -> None:
    matrix = load_qr_matrix()
    frjudo_logo = create_frjudo_logo()
    overlay = backnumber_overlay(matrix, frjudo_logo)
    for base_name, output_name, quad in ASSETS:
        compose(ROOT / base_name, ROOT / output_name, quad, overlay)
        print(output_name)


if __name__ == "__main__":
    main()
