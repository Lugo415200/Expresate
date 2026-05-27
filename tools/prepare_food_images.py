"""Crop the food collage into local game assets.

Usage:
  python tools/prepare_food_images.py assets/food/source-collage.png

The expected collage order is left-to-right, top-to-bottom:
apple, banana, bread, milk, water, rice, egg, chicken, fish, cheese, coffee, tea.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


NAMES = [
    "apple",
    "banana",
    "bread",
    "milk",
    "water",
    "rice",
    "egg",
    "chicken",
    "fish",
    "cheese",
    "coffee",
    "tea",
]


def crop_grid(source: Path, out_dir: Path) -> None:
    img = Image.open(source).convert("RGB")
    width, height = img.size
    cols, rows = 4, 3

    # These percentages match the supplied 4x3 collage with rounded tiles and gutters.
    outer_x = width * 0.010
    outer_y = height * 0.016
    gap_x = width * 0.0105
    gap_y = height * 0.017
    tile_w = (width - (outer_x * 2) - (gap_x * (cols - 1))) / cols
    tile_h = (height - (outer_y * 2) - (gap_y * (rows - 1))) / rows

    out_dir.mkdir(parents=True, exist_ok=True)

    for index, name in enumerate(NAMES):
        row, col = divmod(index, cols)
        left = round(outer_x + col * (tile_w + gap_x))
        top = round(outer_y + row * (tile_h + gap_y))
        right = round(left + tile_w)
        bottom = round(top + tile_h)

        tile = img.crop((left, top, right, bottom))
        tile = fit_on_canvas(tile, (600, 400))
        save_optimized(tile, out_dir / f"{name}.jpg")


def fit_on_canvas(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    canvas_w, canvas_h = size
    img.thumbnail((canvas_w, canvas_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, (246, 246, 245))
    left = (canvas_w - img.width) // 2
    top = (canvas_h - img.height) // 2
    canvas.paste(img, (left, top))
    return canvas


def save_optimized(img: Image.Image, path: Path) -> None:
    quality = 86
    while quality >= 58:
        img.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
        if path.stat().st_size <= 150 * 1024 or quality == 58:
            print(f"{path.name}: {path.stat().st_size} bytes, quality {quality}")
            return
        quality -= 4


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python tools/prepare_food_images.py assets/food/source-collage.png", file=sys.stderr)
        return 2

    source = Path(sys.argv[1])
    if not source.exists():
        print(f"Source image not found: {source}", file=sys.stderr)
        return 1

    crop_grid(source, Path("assets/food"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
