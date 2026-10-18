# Plan docente: anatomía, fisiología y biomecánica

## Público y propósito

El atlas está dirigido a entrenadores físicos y estudiantes iniciales de fisiología y fisioterapia. Cada lección debe responder cuatro preguntas en este orden: **qué se mueve**, **qué estructuras participan**, **qué fuerzas externas se pueden razonar** y **qué procesos fisiológicos requieren otra evidencia**. El modelo es un recurso de estudio, no una medición clínica ni una certificación anatómica.

## Evidencia visual

1. **Anatomía:** conservar como referencia las mallas de BodyParts3D, con el crédito «BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International». La geometría actual está reducida un 99 % y requiere cotejo de cada región con la fuente original antes de presentarla como detalle fino. Añadir vistas regionales estáticas a partir de esa misma geometría o de imágenes con licencia verificada, con plano, orientación, estructuras visibles y procedencia en el pie.
2. **Mecánica:** utilizar diagramas originales para ejes, fuerzas, brazos de momento y trayectorias. Etiquetarlos siempre como esquemas. No superponer flechas que parezcan una medición de fuerza muscular real.
3. **Fisiología:** añadir figuras de unidades motoras, sarcómeros y relación longitud-tensión solo después de verificar la fuente y la licencia. Una malla macroscópica no representa fibras individuales ni permite inferir reclutamiento.
4. **Control de calidad:** para cada imagen registrar autor, URL, licencia, adaptación realizada, región, vista anatómica y revisión de términos. Comparar hueso, articulación e inserciones con una segunda fuente académica antes de publicar nuevos detalles.

## Ruta de aprendizaje

| Nivel | Resultado esperado | Recurso activo | Comprobación |
| --- | --- | --- | --- |
| Inicio | Describir posición, plano y acción | Atlas y movimiento simple | Nombrar eje y segmento |
| Anatomía funcional | Relacionar hueso, articulación, músculo y fijación | Capas y fichas | Explicar una función con una fuente |
| Fisiología | Distinguir demanda externa, tensión y control neural | Guía y preguntas de unidades motoras | Explicar lo que el resaltado no mide |
| Aplicación | Comparar tareas, apoyos y máquinas | Casos de biomecánica y vídeo | Identificar fuerza y brazo externo |
| Análisis crítico | Reconocer límites de modelos y datos | Verificación y bibliografía | Elegir qué medición falta |

## Modelo mecánico: siguiente etapa

El control actual calcula un ejemplo bidimensional: `d⊥ = L × |sen θ|` y `|τ| = F × d⊥` para una fuerza vertical hipotética. Sirve para comparar longitud y ángulo de un solo segmento. No cambia el GLB ni estima fuerza muscular, masa, inercia o reacción del suelo. Para adaptar proporciones corporales de forma consistente, evaluar una capa mecánica separada con escalado por segmentos, centros articulares, masa e inercia y trayectoria músculo-tendón. La documentación de OpenSim describe que escalar un modelo también requiere ajustar estas propiedades y los componentes musculares; cambiar solo la longitud visible del hueso no bastaría.

## Orden de implementación

1. Revisar los ocho casos actuales con una tabla de estructuras, plano, apoyo, acción muscular y fuente primaria; corregir cualquier asociación dudosa.
2. Crear láminas regionales fieles con procedencia y licencia verificadas, empezando por hombro, codo, cadera, rodilla y tobillo. Mantener las figuras de fuerzas como esquemas diferenciados.
3. Añadir trayectorias medidas solo si hay datos abiertos con protocolo, unidades, sujetos y licencia claros; mostrar variación entre personas y no una «técnica correcta» universal.
4. Prototipar el escalado mecánico en un caso, compararlo con OpenSim y validar que huesos, centros articulares y músculos siguen alineados antes de extenderlo.
5. Ampliar el banco de preguntas por regiones y niveles; revisar cada respuesta y su referencia antes de habilitar nuevas rondas.

## Fuentes base verificadas

- [BodyParts3D: descripción](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html) y [licencia](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html).
- [OpenStax, movimientos del cuerpo](https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements) y [palancas del sistema muscular](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-1-interactions-of-skeletal-muscles-their-fascicle-arrangement-and-their-lever-systems).
- [OpenStax, control nervioso de la tensión muscular](https://openstax.org/books/anatomy-and-physiology-2e/pages/10-4-nervous-system-control-of-muscle-tension).
- [OpenSim, escalado de modelos musculoesqueléticos](https://opensimconfluence.atlassian.net/wiki/spaces/OpenSim/pages/53089158).
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference): permite controlar el reproductor y consultar el tiempo, pero no concede acceso a sus fotogramas para análisis local de pose.
