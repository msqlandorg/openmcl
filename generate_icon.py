import os
from PIL import Image

def create_pixel_icon(output_dir):
    colors = {
        'grass_top': (76, 175, 80),
        'grass_side': (102, 187, 106),
        'dirt': (141, 110, 99),
        'dirt_dark': (121, 85, 72),
        'highlight': (129, 199, 132),
        'shadow': (56, 142, 60),
    }
    
    # 4x4 像素方块图案
    pattern = [
        ['highlight', 'grass_side', 'grass_top', 'grass_side'],
        ['grass_side', 'grass_top', 'grass_side', 'grass_top'],
        ['dirt', 'dirt_dark', 'dirt', 'dirt_dark'],
        ['dirt_dark', 'dirt', 'dirt_dark', 'shadow'],
    ]
    
    for size in [256, 128, 64, 48, 32, 16]:
        block_size = size // 4
        img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
        pixels = img.load()
        
        for row in range(4):
            for col in range(4):
                color_name = pattern[row][col]
                r, g, b = colors[color_name]
                
                for y in range(row * block_size, (row + 1) * block_size):
                    for x in range(col * block_size, (col + 1) * block_size):
                        pixels[x, y] = (r, g, b, 255)
        
        png_path = os.path.join(output_dir, f"icon_{size}.png")
        img.save(png_path)
        print(f"PNG {size}x{size} 已生成: {png_path}")
    
    return os.path.join(output_dir, "icon_256.png")

def create_ico_from_png(png_path, ico_path):
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    
    images = []
    for size in icon_sizes:
        img = Image.open(png_path).resize(size, Image.LANCZOS)
        images.append(img)
    
    images[0].save(ico_path, format='ICO', sizes=icon_sizes, append_images=images[1:])
    print(f"ICO 图标已生成: {ico_path}")

if __name__ == "__main__":
    icon_dir = os.path.join(os.path.dirname(__file__), "resources", "icon")
    os.makedirs(icon_dir, exist_ok=True)
    
    png_256_path = create_pixel_icon(icon_dir)
    
    ico_path = os.path.join(icon_dir, "icon.ico")
    create_ico_from_png(png_256_path, ico_path)
    
    png_path = os.path.join(icon_dir, "icon.png")
    import shutil
    shutil.copy(png_256_path, png_path)
    print(f"PNG 图标已复制: {png_path}")
    
    print("\n图标生成完成！")
    print(f"PNG: {png_path}")
    print(f"ICO: {ico_path}")