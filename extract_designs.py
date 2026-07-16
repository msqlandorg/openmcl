import zipfile
import os

zip_path = r'e:\mcLuncher\启动器主页 等 4 个设计.zip'
dest_path = r'e:\mcLuncher\designs'

os.makedirs(dest_path, exist_ok=True)

with zipfile.ZipFile(zip_path, 'r') as zf:
    zf.extractall(dest_path)
    print('Extracted files:')
    for name in zf.namelist():
        print(f'  - {name}')