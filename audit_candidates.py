"""List unselected paired BodyParts3D concepts that have available OBJ meshes."""
import json
import re
import zipfile
from pathlib import Path

root = Path(__file__).parent
source = root / 'assets' / 'source'
manifest = json.loads((root / 'dist/assets/bodyparts-manifest.json').read_text(encoding='utf-8'))
selected = {part['file_id'] for part in manifest.values()}
names = {}
for line in (source / 'isa_parts_list_e.txt').read_text(encoding='utf-8').splitlines()[1:]:
    cols = line.split('\t')
    if len(cols) >= 3:
        names[cols[0]] = cols[2]
elements = {}
for line in (source / 'isa_element_parts.txt').read_text(encoding='utf-8').splitlines()[1:]:
    cols = line.split('\t')
    if len(cols) >= 3:
        elements.setdefault(cols[0], []).append(cols[2])
with zipfile.ZipFile(source / 'bodyparts3d-isa-99.zip') as archive:
    available = {Path(name).stem for name in archive.namelist() if name.lower().endswith('.obj')}
for concept, name in names.items():
    if not re.search(r'\bright\b', name):
        continue
    ids = [file_id for file_id in elements.get(concept, []) if file_id in available and file_id not in selected]
    if ids:
        print(concept, name, len(ids), ','.join(ids[:3]), sep='\t')
