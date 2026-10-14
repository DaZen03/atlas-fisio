"""Create an offline visual preview GLB from the Rajagopal VTP bone surfaces."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools_py"))
import trimesh

NAMES = ["l_femur", "l_fibula", "l_pelvis", "l_tibia", "r_femur", "r_fibula", "r_pelvis", "r_tibia", "sacrum"]
scene = trimesh.Scene()
for name in NAMES:
    path = ROOT / "assets" / f"{name}.vtp"
    root = ET.parse(path).getroot()
    piece = root.find(".//Piece")
    arrays = piece.findall(".//DataArray")
    points_array = next(a for a in arrays if a.get("NumberOfComponents") == "3" and a.get("format") == "ascii")
    polys = piece.find("./Polys")
    poly_arrays = polys.findall("./DataArray")
    conn = next(a for a in poly_arrays if a.get("Name") == "connectivity")
    offs = next(a for a in poly_arrays if a.get("Name") == "offsets")
    vertices = [float(v) for v in points_array.text.split()]
    vertices = [vertices[i:i + 3] for i in range(0, len(vertices), 3)]
    connectivity = [int(v) for v in conn.text.split()]
    offsets = [int(v) for v in offs.text.split()]
    faces, start = [], 0
    for end in offsets:
        polygon = connectivity[start:end]
        for i in range(1, len(polygon) - 1):
            faces.append([polygon[0], polygon[i], polygon[i + 1]])
        start = end
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
    scene.add_geometry(mesh, geom_name=name, node_name=name)

out = ROOT / "assets" / "rajagopal-bones-preview.glb"
scene.export(out)
print(f"GLB preview: {out.name}; meshes={len(scene.geometry)}; triangles={sum(len(m.faces) for m in scene.geometry.values())}")
