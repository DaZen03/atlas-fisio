# Hoja de ruta: trayectorias y fidelidad del atlas

## Alcance actual

El visor usa mallas rígidas por segmento y un rig simplificado. Las animaciones son poses clave interpoladas; las mallas musculares siguen uno o dos segmentos por reglas (`muscleAnchors` / `muscleMotionWeights`). Esto conserva el movimiento básico, pero no reproduce deformación volumétrica, deslizamiento de tendón, contracción activa ni coordinación escapulotorácica completa. No presentar el resultado como simulación clínica.

El catálogo disponible contiene 404 piezas musculares GLB, con capas anatómicas superficial, intermedia y profunda inferidas por nombre. La pieza de malla no equivale necesariamente a un músculo completo ni a fibras musculares individualmente segmentadas. La futura cobertura debe distinguir músculo, porción, cabeza, vientre, tendón y fascículo cuando la fuente geométrica lo permita.

## Mejoras priorizadas

1. **Trayectoria observada:** guardar por fotograma tiempo, puntos 3D, confianza y transformaciones articulares; convertir coordenadas de cámara a una referencia estable usando pelvis como origen, longitud de pierna para escala y eje vertical estimado. Separar datos observados de la animación didáctica.
2. **Suavizado sin borrar el gesto:** filtrar trayectorias con One Euro o Savitzky–Golay, con parámetros documentados; descartar puntos de baja confianza y marcar oclusiones en vez de inventar mediciones. Comparar antes y después para cuantificar retraso y error.
3. **Representación en el atlas:** mapear articulaciones detectadas a pivotes del rig, mostrar trayectoria del marcador y estela temporal, y permitir sincronizar el cursor del vídeo con la pose del atlas. No inferir torsiones fuera del plano desde una sola cámara.
4. **Cinemática de segmentos:** resolver orientación de pelvis, tronco y miembros desde múltiples landmarks; conservar longitudes segmentarias durante interpolación y usar curvas Hermite o splines con tangentes para suavizar velocidad y aceleración entre poses clave. Mantener contactos de pie/mano como restricciones para reducir deslizamiento.
5. **Músculo y fibras:** primero corregir orígenes/inserciones por componente de malla con revisión anatómica; luego deformar vientres con skinning de pesos por vértice o una malla volumétrica de baja resolución. Añadir fibras/fascículos como curvas internas derivadas de trayectos anatómicos solo cuando existan fuente y licencias claras; la dirección de fibra no es el contorno superficial del músculo.
6. **Escala y rendimiento:** conservar GLB base y cargar por región/lado bajo demanda. Usar LOD y geometría simplificada para animación, mantener detalle para selección/zoom, instanciar curvas internas y liberar buffers/materiales al cambiar de región.
7. **Cobertura corporal:** completar por regiones con el mismo registro de procedencia, licencia, nombre anatómico, fijaciones, acción, articulaciones cruzadas, lado, capa, pivotes y validación visual. Prioridad: espalda y pared abdominal; antebrazo y mano; pierna profunda y pie; luego cabeza/cuello y músculos pequeños.

## Validación por cada grupo nuevo

- Fuente y licencia registradas por activo.
- Nombre y fijaciones contrastados con atlas anatómico académico (OpenStax/NCBI) y, para modelos computacionales, OpenSim.
- Revisión visual en reposo y en los movimientos que cruzan cada articulación.
- Pruebas de continuidad de trayectoria, longitudes de segmentos, contactos y deformación sin saltos ni separación del hueso.
- Conteo explícito de piezas y músculos únicos; separar “mallas” de “estructuras anatómicas”.

## Recursos evaluados

- MediaPipe Pose Landmarker entrega landmarks de imagen y coordenadas corporales aproximadas; es útil como entrada observacional, pero una cámara RGB no resuelve por sí sola profundidad ni fuerza muscular. Mantener estimaciones claramente etiquetadas.
- OpenSim Moco permite optimización de trayectorias y controles musculares mediante colocación directa, usando modelos músculo-esqueléticos. Es candidato para generación offline de trayectorias de referencia, no una dependencia adecuada para ejecutar directamente dentro de este visor estático.
- BodyParts3D/Z-Anatomy puede ampliar anatomía por mallas, sujeto a su atribución y licencia. La geometría añadida debe venir con manifiesto y trazabilidad; un repositorio open source no implica por sí solo validación médica.

## Fuentes

- MediaPipe Pose Landmarker web: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js
- OpenSim Moco: https://opensim-org.github.io/opensim-moco-site/docs/1.3.0/
- Moco: optimal control musculoskeletal systems: https://pmc.ncbi.nlm.nih.gov/articles/PMC7793308/
- Open Anatomy Atlas / atribución de BodyParts3D: https://github.com/CognitionLabSNUC/open-anatomy-atlas
- BodyParts3D 4.3 data record and license details: https://zenodo.org/records/22727173
