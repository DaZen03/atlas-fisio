# Atlas del movimiento humano

## Qué es

El Atlas del movimiento humano es un recurso web educativo, interactivo y en español para explorar la anatomía funcional y comprender cómo se relacionan las estructuras del cuerpo con el movimiento. Combina un modelo anatómico 3D, explicaciones, demostraciones de movimiento, herramientas sencillas de biomecánica y actividades de repaso.

El proyecto está pensado para estudiar el cuerpo por regiones y por temas, con páginas separadas para que cada actividad tenga un propósito claro. El visor 3D permanece junto a los controles y la información de estudio en las vistas principales; la interfaz también se adapta a pantallas pequeñas.

## Finalidad

Su finalidad es ayudar a pasar de reconocer una estructura a explicar su papel durante una acción. La persona puede observar una parte del cuerpo, identificar huesos, músculos y articulaciones, seguir un movimiento y relacionarlo con conceptos como plano, eje, palanca, brazo de momento y carga externa.

El contenido busca servir como apoyo para:

- estudiantes que comienzan a estudiar anatomía, fisiología, fisioterapia o biomecánica;
- entrenadores personales que quieran repasar anatomía funcional y describir ejercicios;
- docentes que necesiten un apoyo visual para explicar regiones y movimientos;
- cualquier persona interesada en entender mejor el movimiento humano.

El lenguaje acompaña los términos científicos con explicaciones en palabras comunes. El recorrido va desde conceptos introductorios hasta comparaciones y cálculos didácticos más detallados.

## Qué incluye

### Atlas anatómico 3D

Permite girar y acercar el modelo, seleccionar estructuras, enfocar regiones, cambiar su visibilidad y explorar capas. El conjunto actual contiene 610 mallas derivadas de BodyParts3D: 206 mallas óseas y 404 musculares. También hay 118 fichas de estructuras. El catálogo organiza las mallas musculares en 66 grupos e identifica 196 nombres o porciones; estos números describen el contenido seleccionado para el modelo, no el total biológico de huesos o músculos del cuerpo.

### Movimiento y articulaciones

Incluye 46 movimientos guiados en los planos sagital, frontal y transversal, controles para explorar el movimiento de distintas articulaciones y fichas que relacionan articulación, huesos, músculos y gesto. Las secuencias incluyen fundamentos, acciones cotidianas, ejercicios y gestos deportivos. Son demostraciones didácticas esquematizadas.

### Biomecánica

Presenta explicaciones y esquemas para observar ejes, líneas de fuerza, palancas, brazos de momento y momentos externos. Sus controles permiten cambiar algunos valores hipotéticos —como fuerza, ángulo, punto de aplicación o longitud de un segmento— y observar cómo cambia el cálculo. También compara mecanismos de máquinas de ejercicio, como poleas, levas y brazos de palanca.

### Análisis de movimiento y aprendizaje

El sitio separa el análisis de vídeo, las guías de aprendizaje, las fichas anatómicas, las fuentes y los cuestionarios en páginas propias. Los cuestionarios ayudan a recuperar conceptos y revisar respuestas; la ruta de aprendizaje organiza el estudio desde fundamentos hasta temas de mayor detalle. El «Reto anatómico» añade práctica de identificación visual: resalta un hueso o músculo en el modelo, propone opciones plausibles y permite repetir las estructuras falladas.

## Cómo se recomienda estudiarlo

1. **Define una pregunta:** por ejemplo, qué articulaciones participan en una sentadilla.
2. **Observa la región:** localiza las estructuras relevantes en el atlas y consulta sus fichas.
3. **Sigue el movimiento:** identifica qué segmentos cambian de posición y en qué plano se describe principalmente el gesto.
4. **Relaciona estructura y función:** considera qué músculos pueden contribuir y qué articulaciones atraviesa o mueve cada uno.
5. **Aplica la biomecánica:** usa los diagramas para razonar sobre la línea de fuerza y el momento externo.
6. **Comprueba lo aprendido:** responde una pregunta o explica el movimiento con tus propias palabras.

Este orden es una sugerencia didáctica, no una evaluación certificada ni una ruta personalizada.

## Fuentes y tratamiento del modelo

Las mallas anatómicas se basan en BodyParts3D, con atribución y licencia indicadas en la sección de fuentes del atlas. Se transformaron y simplificaron para su uso interactivo en formato GLB. Las explicaciones de anatomía y biomecánica incluyen referencias bibliográficas y enlaces a fuentes educativas o publicaciones, organizados por tema dentro del sitio.

El atlas distingue entre la malla visual y la explicación textual: una ficha puede representar una estructura o grupo aunque no exista una malla independiente para cada concepto. Las cifras del catálogo describen el paquete digital, no una enumeración exhaustiva de la anatomía humana.

## Alcance y límites

El atlas es material educativo. No ofrece diagnóstico, no evalúa lesiones, no prescribe rehabilitación individual y no sustituye la valoración de profesionales de salud ni la supervisión de un docente o profesional cualificado.

Las animaciones emplean pivotes y transformaciones aproximados; no son capturas de movimiento ni simulaciones anatómicas completas. No calculan fuerzas musculares reales, actividad electromiográfica, equilibrio, reacción del suelo, deformación de tejidos ni deslizamiento articular. Los resaltados de músculos indican una relación didáctica con el gesto, no una medición de activación o esfuerzo. Los esquemas de palancas y cambios de longitud son modelos simplificados, con supuestos visibles en cada herramienta.

Por ello, conviene usar el modelo para formular y entender relaciones generales, y consultar las fuentes enlazadas para profundizar o verificar una afirmación concreta.

## Tecnología y acceso

El sitio se distribuye como páginas web estáticas. El visor 3D utiliza Three.js y modelos GLB; el proyecto también genera una versión HTML autónoma para abrir localmente. La versión web está publicada en GitHub Pages. La disponibilidad de esta publicación no implica privacidad: GitHub Pages en un repositorio público es accesible mediante un enlace público.

Para instrucciones de uso, páginas disponibles, cantidades del catálogo, fuentes y comandos del proyecto, consulta [LEEME.md](../LEEME.md). Para entender los directorios y el proceso de publicación, consulta [estructura-del-proyecto.md](estructura-del-proyecto.md).
