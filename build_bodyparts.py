"""Select named BodyParts3D elements and export a browser-ready GLB atlas."""
import io
import json
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent
SOURCE = ROOT / 'assets' / 'source'
sys.path.insert(0, str(ROOT / 'tools_py'))

ORDINAL = r'(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)'
HAND = {'scaphoid', 'lunate', 'triquetral', 'pisiform', 'trapezium', 'trapezoid', 'capitate', 'hamate'}
SKULL = {'frontal bone', 'occipital bone', 'mandible', 'sphenoid bone', 'ethmoid', 'vomer', 'hyoid bone',
         'right lacrimal bone', 'left lacrimal bone', 'right palatine bone', 'left palatine bone',
         'right inferior nasal concha', 'left inferior nasal concha',
         'right parietal bone', 'left parietal bone',
         'right temporal bone', 'left temporal bone', 'right zygomatic bone', 'left zygomatic bone',
         'right maxilla', 'left maxilla', 'right nasal bone', 'left nasal bone'}
TRUNK_MUSCLES = {'right serratus anterior', 'left serratus anterior', 'right external oblique', 'left external oblique',
                 'right rhomboid major', 'left rhomboid major', 'right rhomboid minor', 'left rhomboid minor'}
PELVIS_MUSCLES = {'iliacus': 'iliopsoas', 'psoas major': 'iliopsoas', 'gluteus maximus': 'gluteusmaximus',
                  'gluteus medius': 'gluteus', 'gluteus minimus': 'gluteusminimus'}
THIGH_MUSCLES = {'sartorius': 'sartorius', 'semitendinosus': 'hamstrings', 'semimembranosus': 'hamstrings',
                 'adductor longus': 'adductorlongus', 'tensor fasciae latae': 'tensorfasciae',
                 'rectus femoris': 'quadriceps', 'vastus lateralis': 'quadriceps',
                 'vastus medialis': 'quadriceps', 'vastus intermedius': 'quadriceps'}
CALF_MUSCLES = {'tibialis anterior': 'tibialis', 'soleus': 'soleus'}
NEW_STATIC_MUSCLES = {
    'pectoralis minor':'pectoralisminor', 'sternocleidomastoid':'neckmuscles',
    'splenius capitis':'neckmuscles', 'splenius cervicis':'neckmuscles', 'levator scapulae':'levatorscapulae',
    'sternohyoid':'neckmuscles', 'omohyoid':'neckmuscles',
    'sternothyroid':'neckmuscles', 'thyrohyoid':'neckmuscles', 'platysma':'neckmuscles',
    'piriformis':'hiprotators', 'obturator internus':'hiprotators',
    'obturator externus':'hiprotators', 'quadratus femoris':'hiprotators',
    'gemellus superior':'hiprotators', 'gemellus inferior':'hiprotators',
    'scalenus anterior':'scalenes', 'scalenus medius':'scalenes', 'scalenus posterior':'scalenes',
    'subclavius':'subclavius',
    'serratus posterior superior':'serratusposterior', 'serratus posterior inferior':'serratusposterior',
}
NEW_ARM_MUSCLES = {'teres major':'teresmajor', 'coracobrachialis':'coracobrachialis'}
NEW_FOREARM_MUSCLES = {
    'pronator quadratus':'pronators', 'anconeus':'anconeus', 'supinator':'supinator',
    'flexor pollicis longus':'thumbtendons', 'extensor pollicis longus':'thumbtendons',
    'extensor pollicis brevis':'thumbtendons', 'flexor carpi radialis':'wristflexors',
    'palmaris longus':'wristflexors', 'flexor digitorum profundus':'wristflexors',
    'extensor carpi radialis longus':'wristextensors',
    'extensor carpi radialis brevis':'wristextensors',
    'extensor carpi ulnaris':'wristextensors', 'extensor indicis':'wristextensors',
    'extensor digiti minimi':'wristextensors', 'abductor pollicis longus':'thumbtendons',
}
HAND_INTRINSICS = {'opponens pollicis', 'set of dorsal interossei of hand',
                   'set of palmar interossei of hand', 'set of lumbricals of hand',
                   'abductor digiti minimi of hand', 'flexor digiti minimi brevis of hand',
                   'abductor pollicis brevis', 'flexor pollicis brevis',
                   'opponens digiti minimi of hand'}
NEW_THIGH_MUSCLES = {'pectineus':'adductors', 'adductor brevis':'adductors',
                     'adductor magnus':'adductors', 'adductor minimus':'adductors', 'gracilis':'adductors'}
NEW_CALF_MUSCLES = {'extensor digitorum longus':'lowerlegmuscles',
                    'extensor hallucis longus':'lowerlegmuscles',
                    'fibularis longus':'lowerlegmuscles', 'fibularis brevis':'lowerlegmuscles',
                    'fibularis tertius':'lowerlegmuscles', 'plantaris':'lowerlegmuscles',
                    'popliteus':'popliteus', 'flexor hallucis longus':'lowerlegmuscles',
                    'flexor digitorum longus':'lowerlegmuscles', 'tibialis posterior':'lowerlegmuscles'}
NEW_FOOT_MUSCLES = {'abductor hallucis':'footmuscles', 'flexor digitorum brevis':'footmuscles',
                    'extensor hallucis brevis':'footmuscles',
                    'abductor digiti minimi of foot':'footmuscles',
                    'flexor digiti minimi brevis of foot':'footmuscles',
                    'opponens digiti minimi of foot':'footmuscles',
                    'flexor accessorius':'footmuscles'}
DEEP_MUSCLES = {
    'transversus thoracis':'thoracicdeep',
    'interspinalis thoracis':'deepback', 'lumbar rotator':'deepback',
    'lateral lumbar intertransversarius':'intertransversarii',
    'medial lumbar intertransversarius':'intertransversarii',
    'lumbar intertransversarius':'intertransversarii',
    'cervical rotator':'deepneck',
    'set of levatores costarum longi':'thoracicdeep',
    'set of levatores costarum breves':'thoracicdeep',
    'rectus capitis posterior major':'deepneck', 'rectus capitis posterior minor':'deepneck',
    'obliquus capitis superior':'deepneck', 'obliquus capitis inferior':'deepneck',
    'longus capitis':'deepneck', 'rectus capitis anterior':'deepneck',
    'rectus capitis lateralis':'deepneck',
    'stylohyoid':'suprahyoid', 'digastric':'suprahyoid',
    'mylohyoid':'suprahyoid', 'geniohyoid':'suprahyoid',
    'pubococcygeus':'pelvicfloor', 'puborectalis':'pelvicfloor',
    'iliococcygeus':'pelvicfloor', 'coccygeus':'pelvicfloor',
    'posterior crico-arytenoid':'larynxmuscles',
    'lateral crico-arytenoid':'larynxmuscles',
    'oblique arytenoid':'larynxmuscles', 'thyro-arytenoid':'larynxmuscles',
    'vocalis':'larynxmuscles', 'aryepiglotticus':'larynxmuscles',
    'straight part of cricothyroid':'larynxmuscles',
    'oblique part of cricothyroid':'larynxmuscles',
    'superior pharyngeal constrictor':'pharynxmuscles',
    'middle pharyngeal constrictor':'pharynxmuscles',
    'inferior pharyngeal constrictor':'pharynxmuscles',
    'stylopharyngeus':'pharynxmuscles', 'salpingopharyngeus':'pharynxmuscles',
    'palatopharyngeus':'pharynxmuscles',
    'levator veli palatini':'pharynxmuscles', 'tensor veli palatini':'pharynxmuscles',
    'genioglossus':'tonguemuscles', 'hyoglossus':'tonguemuscles',
    'superior rectus':'eyemuscles', 'inferior rectus':'eyemuscles',
    'lateral rectus':'eyemuscles', 'medial rectus':'eyemuscles',
    'superior oblique':'eyemuscles', 'inferior oblique':'eyemuscles',
    'levator palpebrae superioris':'eyemuscles',
}

def category(name):
    side = 'R' if re.search(r'\bright\b', name) else 'L' if re.search(r'\bleft\b', name) else ''
    moving = lambda part: part + ('L' if side == 'L' else '')
    if name in SKULL: return 'mandible' if name == 'mandible' else 'skull', 'head', 'bones'
    if name in {'atlas', 'axis'} or re.fullmatch(rf'{ORDINAL} cervical vertebra', name): return 'cervical', 'static', 'bones'
    if re.fullmatch(rf'{ORDINAL} thoracic vertebra', name): return 'thoracic', 'static', 'bones'
    if re.fullmatch(rf'{ORDINAL} lumbar vertebra', name): return 'lumbar', 'static', 'bones'
    if name in {'sacrum', 'coccyx'}: return 'sacrum', 'static', 'bones'
    if name in {'manubrium', 'body of sternum', 'xiphoid process'}: return 'sternum', 'static', 'bones'
    if name == 'diaphragm': return 'diaphragm', 'static', 'muscles'
    if name in {'intertransversarius muscle','lumbar intertransversarius',
                'lateral lumbar intertransversarius','medial lumbar intertransversarius'}:
        return 'intertransversarii', 'static', 'muscles'
    if name in {'external intercostal muscle','internal intercostal muscle','innermost intercostal muscle'}:
        return {'external intercostal muscle':'externalintercostals',
                'internal intercostal muscle':'internalintercostals',
                'innermost intercostal muscle':'innermostintercostals'}[name], 'static', 'muscles'
    if re.fullmatch(rf'(right|left) {ORDINAL} rib', name): return 'ribs', 'static', 'bones'
    if not side: return None
    bare = name.replace('right ', '').replace('left ', '')
    if name in {f'navicular bone of {side} foot' for side in ('right','left')}:
        return 'navicular', moving('ankle'), 'bones'
    if name in {f'sesamoid bone of {side} foot' for side in ('right','left')}:
        return 'sesamoids', moving('ankle'), 'bones'
    if bare in DEEP_MUSCLES:
        structure=DEEP_MUSCLES[bare]
        return structure, 'head' if structure in {'deepneck','suprahyoid','larynxmuscles','pharynxmuscles','tonguemuscles','eyemuscles'} else 'static', 'muscles'
    if bare in {'clavicle','scapula','hip bone'}:
        return {'hip bone':'pelvis'}.get(bare,bare), 'static', 'bones'
    if bare == 'humerus': return 'humerus', moving('shoulder'), 'bones'
    if bare == 'radius': return bare, moving('forearm'), 'bones'
    if bare == 'ulna': return bare, moving('elbow'), 'bones'
    if bare in HAND or re.search(r'metacarpal bone|phalanx.*(?:finger|thumb)', name):
        structure = 'handphalanges' if 'phalanx' in name else 'metacarpals' if 'metacarpal' in name else 'carpals'
        return structure, moving('wrist'), 'bones'
    if bare == 'femur': return bare, moving('hip'), 'bones'
    if bare == 'patella': return bare, moving('knee'), 'bones'
    if bare in {'tibia','fibula'}: return bare, moving('knee'), 'bones'
    if bare in {'talus','calcaneus','navicular bone','cuboid bone','medial cuneiform bone','intermediate cuneiform bone','lateral cuneiform bone'}:
        structure = {'navicular bone':'navicular','cuboid bone':'cuboid','medial cuneiform bone':'cuneiforms',
                     'intermediate cuneiform bone':'cuneiforms','lateral cuneiform bone':'cuneiforms'}.get(bare,bare)
        return structure, moving('ankle'), 'bones'
    if re.search(r'metatarsal bone|phalanx.*toe', name):
        return 'toephalanges' if 'phalanx' in name else 'metatarsals', moving('ankle'), 'bones'
    if name in TRUNK_MUSCLES:
        return ('serratus' if 'serratus' in name else 'rhomboids' if 'rhomboid' in name else 'externaloblique'), 'static', 'muscles'
    if 'part of' in name and 'trapezius' in name:
        return 'trapezius', 'static', 'muscles'
    if 'part of' in name and 'deltoid' in name:
        return 'deltoid', 'static', 'muscles'
    if 'part of' in name and 'pectoralis major' in name:
        return 'pectoralis', 'static', 'muscles'
    if 'head of' in name and 'biceps brachii' in name:
        return 'biceps', moving('shoulder'), 'muscles'
    if 'head of' in name and 'triceps brachii' in name:
        return 'triceps', moving('shoulder'), 'muscles'
    if 'head of' in name and 'gastrocnemius' in name:
        return 'gastrocnemius', moving('knee'), 'muscles'
    if 'head of' in name and 'biceps femoris' in name:
        return 'hamstrings', moving('hip'), 'muscles'
    if 'head of' in name and 'pronator teres' in name:
        return 'pronators', moving('forearm'), 'muscles'
    if 'head of' in name and 'flexor carpi ulnaris' in name:
        return 'wristflexors', moving('elbow'), 'muscles'
    if 'head of' in name and 'flexor hallucis brevis' in name:
        return 'footmuscles', moving('ankle'), 'muscles'
    if 'head of' in name and 'adductor hallucis' in name:
        return 'footmuscles', moving('ankle'), 'muscles'
    if 'head of' in name and 'adductor pollicis' in name:
        return 'handintrinsics', moving('wrist'), 'muscles'
    if bare == 'superficial head of flexor pollicis brevis':
        return 'handintrinsics', moving('wrist'), 'muscles'
    if bare in {'supraspinatus','infraspinatus muscle','subscapularis','teres minor'}:
        return {'infraspinatus muscle':'infraspinatus'}.get(bare,bare.replace(' ','')), 'static', 'muscles'
    if bare in {'brachialis','brachioradialis','flexor digitorum superficialis','extensor digitorum'}:
        structure = {'flexor digitorum superficialis':'forearmflexors','extensor digitorum':'forearmextensors'}.get(bare,bare)
        return structure, moving('elbow' if bare == 'brachioradialis' else 'shoulder' if bare == 'brachialis' else 'elbow'), 'muscles'
    if bare in PELVIS_MUSCLES: return PELVIS_MUSCLES[bare], 'static', 'muscles'
    if bare in HAND_INTRINSICS: return 'handintrinsics', moving('wrist'), 'muscles'
    if re.fullmatch(rf'{ORDINAL} lumbrical of foot',bare) or re.fullmatch(r'(?:first|second|third) plantar interosseous of foot',bare):
        return 'footmuscles', moving('ankle'), 'muscles'
    if bare in THIGH_MUSCLES: return THIGH_MUSCLES[bare], moving('hip'), 'muscles'
    if bare in CALF_MUSCLES: return CALF_MUSCLES[bare], moving('knee'), 'muscles'
    if bare in NEW_STATIC_MUSCLES:return NEW_STATIC_MUSCLES[bare], 'static', 'muscles'
    if bare in NEW_ARM_MUSCLES:return NEW_ARM_MUSCLES[bare], moving('shoulder'), 'muscles'
    if bare in NEW_FOREARM_MUSCLES:return NEW_FOREARM_MUSCLES[bare], moving('forearm') if bare in {'pronator quadratus','supinator'} else moving('elbow'), 'muscles'
    if bare in NEW_THIGH_MUSCLES:return NEW_THIGH_MUSCLES[bare], moving('hip'), 'muscles'
    if bare in NEW_CALF_MUSCLES:return NEW_CALF_MUSCLES[bare], moving('knee'), 'muscles'
    if bare in NEW_FOOT_MUSCLES:return NEW_FOOT_MUSCLES[bare], moving('ankle'), 'muscles'
    if bare == 'intertransversarius muscle': return 'intertransversarii', 'static', 'muscles'
    if any(bare.startswith(prefix) for prefix in ('iliocostalis ','longissimus ','semispinalis ')):
        structure=next(prefix.strip() for prefix in ('iliocostalis ','longissimus ','semispinalis ') if bare.startswith(prefix))
        return structure, 'static', 'muscles'
    if bare == 'spinalis thoracis': return 'spinalis', 'static', 'muscles'
    return None

names={}
for row in (SOURCE/'isa_parts_list_e.txt').read_text(encoding='utf-8').splitlines()[1:]:
    cols=row.split('\t')
    if len(cols)>=3:names[cols[0]]=cols[2]
elements={}
for row in (SOURCE/'isa_element_parts.txt').read_text(encoding='utf-8').splitlines()[1:]:
    cols=row.split('\t')
    if len(cols)>=3:elements.setdefault(cols[0],[]).append(cols[2])
with zipfile.ZipFile(SOURCE/'bodyparts3d-isa-99.zip') as archive:
    entries={Path(name).stem:name for name in archive.namelist() if name.lower().endswith('.obj')}
    selected={}
    missing=[]
    for concept,name in names.items():
        result=category(name)
        if not result:continue
        for file_id in elements.get(concept,[]):
            if file_id not in entries:
                missing.append((name,file_id));continue
            display_name=name
            if name in {'external intercostal muscle','internal intercostal muscle','innermost intercostal muscle'}:
                display_name=('left ' if file_id.endswith('M') else 'right ')+name
            elif 'intertransversarius' in name:
                part='lateral' if file_id.startswith('FJ1547') else 'medial'
                side='left' if file_id.endswith('M') else 'right'
                display_name=f'{side} {part} lumbar intertransversarius'
            selected.setdefault(file_id,{'name':display_name,'structure':result[0],'segment':result[1],'layer':result[2]})
    print('Selected',len(selected),'meshes:',dict(Counter(item['layer'] for item in selected.values())))
    print('Segments:',dict(Counter(item['segment'] for item in selected.values())))
    print('Missing:',missing[:10], 'total',len(missing))
    if '--dry-run' in sys.argv:
        for key,value in selected.items():print(key,value)
        sys.exit(0)
    import numpy as np
    import trimesh
    from trimesh.visual.material import PBRMaterial
    scene=trimesh.Scene()
    manifest={}
    raw={}
    for file_id,item in selected.items():
        payload=archive.read(entries[file_id])
        mesh=trimesh.load(io.BytesIO(payload),file_type='obj',force='mesh',process=False)
        if len(mesh.faces):raw[file_id]=mesh
    lower=min(mesh.bounds[0,2] for mesh in raw.values())
    upper=max(mesh.bounds[1,2] for mesh in raw.values())
    scale=5.15/(upper-lower)
    vertical_offset=-2.55-lower*scale
    transform=np.array([[scale,0,0,0],[0,0,scale,vertical_offset],[0,-scale,0,0],[0,0,0,1]],dtype=float)
    joint_bones={f'{side}_{bone}':next((fid for fid,item in selected.items() if item['name']==f'{side} {bone}'),None)
                 for side in ('right','left') for bone in ('humerus','radius','femur','tibia','talus')}
    def endpoint(key,high):
        points=raw[joint_bones[key]].vertices
        limit=np.quantile(points[:,2],.94 if high else .06)
        return points[points[:,2]>=limit if high else points[:,2]<=limit].mean(axis=0)
    def world(point):return (transform @ np.append(point,1))[:3].round(5).tolist()
    joint_positions={}
    for side,suffix in (('right',''),('left','L')):
        joint_positions.update({
            'shoulder'+suffix:world(endpoint(f'{side}_humerus',True)),
            'elbow'+suffix:world((endpoint(f'{side}_humerus',False)+endpoint(f'{side}_radius',True))/2),
            'wrist'+suffix:world(endpoint(f'{side}_radius',False)),
            'hip'+suffix:world(endpoint(f'{side}_femur',True)),
            'knee'+suffix:world((endpoint(f'{side}_femur',False)+endpoint(f'{side}_tibia',True))/2),
            'ankle'+suffix:world((endpoint(f'{side}_tibia',False)+endpoint(f'{side}_talus',True))/2),
        })
    atlas_id=next(fid for fid,item in selected.items() if item['name']=='atlas')
    joint_positions['neck']=world(raw[atlas_id].vertices.mean(axis=0))
    for file_id,item in selected.items():
        mesh=raw.get(file_id)
        if mesh is None:continue
        mesh.apply_transform(transform)
        base=[0.91,0.85,0.72,1] if item['layer']=='bones' else [0.74,0.37,0.31,1]
        mesh.visual.material=PBRMaterial(baseColorFactor=base,metallicFactor=0.0,roughnessFactor=.82,doubleSided=True)
        node=f"anatomy__{item['structure']}__{item['segment']}__{file_id}"
        scene.add_geometry(mesh,node_name=node,geom_name=node)
        manifest[node]={**item,'file_id':file_id,'vertices':len(mesh.vertices),'faces':len(mesh.faces)}
    out=ROOT/'dist'/'assets'
    out.mkdir(parents=True,exist_ok=True)
    scene.export(out/'bodyparts.glb')
    (out/'bodyparts-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    (out/'bodyparts-joints.json').write_text(json.dumps(joint_positions,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Source vertical bounds:',lower,upper,'scale:',scale)
    print('Joint pivots:',joint_positions)
    print('Exported',out/'bodyparts.glb','bytes', (out/'bodyparts.glb').stat().st_size)
