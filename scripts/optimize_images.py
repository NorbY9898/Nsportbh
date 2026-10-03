from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
for source in (PUBLIC / "assets" / "images").rglob("*.png"):
    if source.stem.endswith("-base"):
        continue
    target = source.with_suffix(".webp")
    with Image.open(source) as image:
        image.save(target, "WEBP", quality=84, method=6, optimize=True)
        if source.name in {"hero-judoka-popescu.png", "hero-judoka-popescu-v2.png", "hero-judoka-popescu-v3.png", "hero-judoka-popescu-v4.png"}:
            mobile = image.copy()
            mobile.thumbnail((960, 960), Image.Resampling.LANCZOS)
            mobile.save(source.with_name(f"{source.stem}-960.webp"), "WEBP", quality=82, method=6, optimize=True)
    print(f"{source.relative_to(PUBLIC)} -> {target.relative_to(PUBLIC)}")
