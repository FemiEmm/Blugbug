import os
import sys
from PIL import Image, ImageOps

source, destination, max_dimension = sys.argv[1], sys.argv[2], int(sys.argv[3])
os.makedirs(os.path.dirname(destination), exist_ok=True)
with Image.open(source) as image:
    image = ImageOps.exif_transpose(image)
    image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "transparency" in image.info else "RGB")
    image.save(destination, "WEBP", quality=82, method=6)
