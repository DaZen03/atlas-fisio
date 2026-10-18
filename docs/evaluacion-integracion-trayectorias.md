# Evaluación de integración: movimiento, trayectorias y mallas musculares

Fecha de revisión: 17 de octubre de 2026.

## Decisión recomendada

Mantener MediaPipe Pose Landmarker como la entrada inmediata dentro de la página de análisis ya creada. Usarlo para extraer landmarks por fotograma, filtrar ruido, derivar ángulos y dibujar una trayectoria temporal. Para enlazarlo al atlas, mapear los landmarks de pelvis, hombro, codo, muñeca, rodilla y tobillo a los pivotes del rig, con calibración inicial y escala normalizada. Mostrar vídeo y atlas sincronizados; distinguir claramente “trayectoria observada” y “animación ilustrativa”.

Usar OpenSim (modelos + Moco) como banco offline: importar una secuencia experimental, ajustar/optimizar cinemática y producir ejemplos de referencia versionados (CSV/JSON) que el atlas pueda reproducir. No intentar compilar Moco dentro del sitio estático: es un entorno de simulación con modelos, dependencias numéricas y resolución de optimal control, no un módulo JS ligero.

No integrar OpenCap automáticamente en la web. Es la opción más interesante para validación dinámica más completa, pero su flujo deriva cinemática/dinámica mediante cómputo cloud y requiere cuenta/dispositivos compatibles. Si se usa para referencias, hacerlo como flujo voluntario separado, con consentimiento de carga y control de los datos. La disponibilidad de su modo monocular está identificada como beta en su sitio.

## Comparación de candidatos

| Recurso | Aporta | Ajuste al atlas actual | Decisión |
|---|---|---|---|
| MediaPipe Pose Landmarker | 33 landmarks 2D y world landmarks; corre en navegador y ya está integrado | Muy alto para trayectorias observacionales y conexión directa con el rig. Monocular: la profundidad y el ángulo fuera del plano son inciertos; no da fuerzas ni músculos | Integrar primero; añadir almacenamiento por fotograma, filtro configurable, confianza y cursor sincronizado |
| OpenSim Moco | Dinámica multisegmento, músculo-tendón, restricciones y optimización de trayectorias | Medio como generador científico offline; bajo como ejecución en navegador | Usar para trayectorias de referencia y comparar; no reemplazar el atlas web |
| OpenCap | Estimación de cinemática y dinámica desde vídeo, validada frente a captura de movimiento y plataformas de fuerza en estudios publicados | Medio para contrastar ciertos gestos; acoplamiento directo bajo y nube implica transferencia de vídeo | Opción de validación externa, no dependencia ni redirección por defecto |
| BodyParts3D / Z-Anatomy | Mallas adicionales con nomenclatura y organización anatómica | Alto para completar cobertura espacial; variable para animación, pues cada recurso requiere pivote, segmentación y registro de licencia | Evaluar por lote y región; no descargar el atlas entero sin curar y verificar cada componente |

## Qué significa “trayectoria” aquí

Separar tres magnitudes para evitar mezclas:

1. Trayectoria de landmark: posición del punto detectado en cada instante, con confianza y unidades claramente declaradas.
2. Trayectoria articular/segmentaria: ángulos o transformaciones del rig derivados de varios landmarks y una calibración neutral.
3. Trayectoria de referencia simulada: movimiento generado o optimizado en OpenSim; no es la trayectoria real de la persona del vídeo.

Primer prototipo de integración: guardar `{t, landmarkId, x, y, z, visibility}`; usar el centro de caderas como origen; escalar por una longitud segmentaria observada y mantenerla constante; suavizar con One Euro o Savitzky–Golay; no interpolar tramos ocluidos sin marcarlos. Dibujar en Three.js una estela con color por confianza y permitir seleccionar tiempo para mover el atlas a la pose estimada. Para cámara única limitar salida a plano observado y mostrar aviso de ambigüedad de profundidad.

## Lo que demuestra la inspección de las mallas existentes

El manifiesto usa componentes GLB etiquetados por `structure`, `segment` y `layer`; hay 404 mallas clasificadas como músculos. El rig vincula los grupos musculares a uno o dos segmentos con reglas en `muscleAnchors` y `muscleMotionWeights`; eso sirve para acompañamiento rígido, pero no constituye un modelo de fibras. Las capas superficial/intermedia/profunda se infieren parcialmente del nombre. Por ello, antes de sumar cientos de geometrías conviene mejorar metadatos y anclajes por componente.

### Plan incremental de fibras

- Fase A: auditar duplicados, lateralidad, nombres FMA, unidad, escala, pivote y componente anatómico en el manifiesto; generar un reporte por región y músculos sin correspondencia.
- Fase B: añadir para cada músculo las fijaciones proximal/distal, articulaciones cruzadas, segmento dominante, grupo de deformación y fuente. Mantener invariantes de no desprendimiento y longitudes razonables durante la animación.
- Fase C: deformación con pesos por vértice o skinning limitado por región; usar malla de baja resolución para animación y conservar GLB detallado como superficie seleccionable.
- Fase D: añadir líneas de fascículos como curvas internas solo en músculos con orientación respaldada por fuente; usar colores/interruptor “fascículos esquemáticos”, no presentarlos como fibras reales si se sintetizan.
- Fase E: ampliar región por región con QA visual en reposo y varios extremos del rango, medidas de tiempo de carga y trazabilidad/licencia por activo.

## Riesgos y controles

- No deducir activación EMG, fuerza ni esfuerzo a partir del color muscular o de la pose de cámara.
- La salida world-landmarks de cámara única no reemplaza calibración multicámara ni captura de laboratorio.
- Los modelos OpenSim son representaciones científicas con supuestos y escalado; revisar la licencia del modelo concreto antes de empaquetarlo. El código abierto del solver no garantiza uso libre de todos los activos asociados.
- OpenCap documenta cómputo cloud. No enviar vídeos desde el atlas sin una acción y consentimiento explícitos del usuario.
- Las mallas de BodyParts3D requieren conservar su atribución y licencia share-alike aplicable a la versión; verificar antes de redistribuir modelos derivados.

## Fuentes principales

- [MediaPipe Pose Landmarker para web](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js)
- [OpenSim Moco API](https://opensim-org.github.io/opensim-moco-site/docs/1.3.0/)
- [Artículo técnico de OpenSim Moco](https://pmc.ncbi.nlm.nih.gov/articles/PMC7793308/)
- [OpenCap: plataforma y modos de captura](https://www.opencap.ai/)
- [OpenCap: artículo de validación de dos iPhone](https://mobl.mech.utah.edu/wp-content/uploads/2023/12/opencap.pdf)
- [Modelos músculo-esqueléticos de OpenSim](https://opensimconfluence.atlassian.net/wiki/spaces/OpenSim/pages/53090607/Mus)
- [Open Anatomy Atlas y atribución](https://github.com/CognitionLabSNUC/open-anatomy-atlas)
- [Registro BodyParts3D 4.3](https://zenodo.org/records/22727173)
