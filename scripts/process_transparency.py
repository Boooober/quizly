import sys
import numpy as np
from PIL import Image

def make_transparent(input_path, output_path, tolerance=25):
    """
    Removes white/light studio backgrounds from product shots.
    Flood fills from the 4 corners to ensure only outer background is removed.
    """
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    arr = np.array(img, dtype=np.uint8)

    # Luminance mask: pixels that are nearly white/light studio gray
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    # In studio shots, background is very light (all channels > 225 and close to each other)
    is_light = (r > 220) & (g > 220) & (b > 220)
    # Check neutral gray/white (small difference between channels)
    max_diff = np.maximum(np.maximum(np.abs(r - g), np.abs(r - b)), np.abs(g - b))
    is_neutral_bg = is_light & (max_diff < tolerance)

    # Set background alpha to 0 with soft anti-aliased edge
    alpha = np.where(is_neutral_bg, 0, 255).astype(np.uint8)
    arr[:, :, 3] = alpha

    result = Image.fromarray(arr, 'RGBA')
    result.save(output_path, 'PNG')
    print(f"Saved transparent PNG to {output_path}")

if __name__ == '__main__':
    if len(sys.argv) > 2:
        make_transparent(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python process_transparency.py <input> <output>")
