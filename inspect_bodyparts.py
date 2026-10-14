import re
import zipfile
from pathlib import Path

root=Path('assets/source')
names={row.split('\t')[0]:row.rstrip('\n').split('\t')[2] for row in (root/'isa_parts_list_e.txt').read_text().splitlines()[1:] if len(row.split('\t'))>=3}
files={}
for line in (root/'isa_element_parts.txt').read_text().splitlines()[1:]:
    cols=line.split('\t')
    if len(cols)>=3:files.setdefault(cols[0],[]).append(cols[2])
samples=['right humerus','right radius','right femur','right tibia','right talus','manubrium','body of sternum','right scapula','first thoracic vertebra','right hip bone','frontal bone','mandible','right gluteus maximus','acromial part of right deltoid']
with zipfile.ZipFile(root/'bodyparts3d-isa-99.zip') as z:
    zmap={Path(n).stem:n for n in z.namelist() if n.endswith('.obj')}
    for target in samples:
        for cid,name in names.items():
            if name==target:
                for fid in files.get(cid,[]):
                    if fid not in zmap:continue
                    with z.open(zmap[fid]) as stream: header=stream.read(1600).decode('latin1')
                    bound=re.search(r'Bounds\(mm\):\s*([^\n]+)',header)
                    print(f'{target:36} {fid:8} {bound.group(1).strip() if bound else "no bounds"}')
