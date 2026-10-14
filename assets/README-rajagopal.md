# Modelo de referencia OpenSim: Rajagopal 2016

Se descargó `rajagopal-reference.osim` desde el repositorio oficial `opensim-org/opensim-models`, carpeta `Models/Rajagopal`.

Este archivo conserva la definición musculoesquelética OpenSim para una prueba offline: cuerpos rígidos, articulaciones, músculos, puntos de trayectoria y referencias a geometrías VTP. No es una malla GLB lista para el visor. La geometría y la escala deben resolverse desde los archivos VTP del repositorio y compararse con BodyParts3D antes de mostrarla como anatomía del atlas.

Como primer paso se descargaron las nueve geometrías óseas VTP disponibles para esta carpeta y se convirtieron a `rajagopal-bones-preview.glb`. El conversor `tools/convert_opensim_vtp.py` genera una vista de superficie estática. La prueba de lectura del GLB encontró 9 mallas y 3,305 triángulos. El conjunto cubre pelvis y huesos de miembro inferior; no añade mallas musculares ni movimiento al atlas todavía. La escala del GLB permanece en metros aproximados, según el sistema de coordenadas de OpenSim.

La documentación del repositorio describe la publicación del modelo Rajagopal 2016 para simulación de marcha. No afirma certificación como dispositivo médico. El artículo recomienda ampliar su validación para otros movimientos. El modelo sirve como referencia de investigación para estudiar cinemática de marcha, no como norma clínica.

Fuente y metadatos: https://github.com/opensim-org/opensim-models/tree/master/Models/Rajagopal
Artículo: https://pubmed.ncbi.nlm.nih.gov/27392337/
README del modelo: https://github.com/opensim-org/opensim-models/blob/master/Models/Rajagopal/README.txt

Respeta las licencias específicas de los archivos del proyecto OpenSim. El repositorio principal usa Apache-2.0 para el software, pero los modelos pueden tener licencias propias; verifica la licencia de la carpeta antes de redistribuir el modelo o sus geometrías.
