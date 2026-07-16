import os
import shutil

base_dir = r'e:\mcLuncher'
assets_dir = os.path.join(base_dir, 'assets')
pages_dir = os.path.join(base_dir, 'pages')

os.makedirs(assets_dir, exist_ok=True)
os.makedirs(pages_dir, exist_ok=True)

files_to_copy = [
    ('Creeper 图标.jpg', 'logo.jpg'),
    ('主视觉横幅.jpg', 'banner.jpg'),
    ('模组展示图.jpg', 'mod_showcase.jpg'),
]

for src_name, dst_name in files_to_copy:
    src_path = os.path.join(base_dir, src_name)
    dst_path = os.path.join(assets_dir, dst_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f'Copied: {src_name} -> {dst_name}')
    else:
        print(f'Source not found: {src_path}')

design_assets_dir = os.path.join(base_dir, 'designs', 'assets')
if os.path.exists(design_assets_dir):
    for item in os.listdir(design_assets_dir):
        src_path = os.path.join(design_assets_dir, item)
        dst_path = os.path.join(assets_dir, item)
        if os.path.isfile(src_path):
            shutil.copy2(src_path, dst_path)
            print(f'Copied from designs: {item}')

print('Assets setup complete!')

design_pages_dir = os.path.join(base_dir, 'designs', 'pages')
if os.path.exists(design_pages_dir):
    for item in os.listdir(design_pages_dir):
        src_path = os.path.join(design_pages_dir, item)
        dst_path = os.path.join(pages_dir, item)
        if os.path.isfile(src_path):
            shutil.copy2(src_path, dst_path)
            print(f'Copied page: {item}')

print('Pages setup complete!')