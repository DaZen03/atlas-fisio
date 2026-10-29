# Reto anatómico 3D

## Propósito

El reto convierte el atlas en una actividad de identificación visual. La persona observa una estructura resaltada, gira el cuerpo, responde y contrasta su elección con una explicación anatómica. Busca practicar reconocimiento espacial y recuperación activa, no certificar competencia clínica.

## Primera versión

- Página independiente en `vistas/reto-anatomico.html`.
- Selección por región: cabeza y cuello, tronco, miembro superior, miembro inferior o cuerpo completo.
- Selección por contenido: huesos, músculos o ambos.
- Rondas de 5, 10 o 15 preguntas.
- Cuatro opciones construidas con estructuras del catálogo que sí tienen representación en el GLB.
- Distractores del mismo tipo y, primero, de la misma región.
- Estructura objetivo resaltada en amarillo, con vista anterior, lateral o posterior aleatoria.
- Pista opcional con tipo, región e inicial.
- Puntuación, racha y mejor resultado guardado localmente.
- Retroalimentación con nombre, descripción, función y fuentes.
- Repetición de las estructuras falladas.

## Reglas de contenido

Las respuestas proceden de las fichas y de los identificadores de malla que ya usa el atlas. Una estructura solo entra en el juego si el manifiesto confirma que existe una malla relacionada. El resaltado indica el objetivo de la pregunta y no activación, fuerza o contracción.

Los grupos musculares pueden abarcar varias mallas o porciones. En esta etapa la respuesta corresponde a la ficha del grupo anatómico representado. Una fase posterior podrá preguntar por piezas individuales cuando sus nombres, lados y equivalencias en español estén revisados.

## Experiencia en computadora y móvil

En computadora, la actividad queda a la izquierda y el visor permanece visible a la derecha. En móvil, el visor queda arriba y el juego debajo. Los nombres emergentes y la tarjeta de selección se ocultan durante la ronda para evitar revelar la respuesta; se conservan rotación, zoom y cambio de vista.

## Ampliaciones previstas

1. Modo «Encuentra la estructura»: se muestra el nombre y la persona toca la malla correcta.
2. Modo pieza aislada: muestra un hueso o músculo sin el resto del cuerpo y cambia su orientación.
3. Respuesta escrita con sinónimos aceptados y tolerancia controlada.
4. Preguntas de lateralidad, inserciones, articulaciones y función.
5. Dificultad adaptativa basada en errores recientes, sin convertir el resultado en diagnóstico o certificación.
6. Historial por estructura y exportación de una sesión para uso docente.

## Criterios para una ampliación

Cada nuevo tipo de pregunta debe indicar la estructura exacta, los nombres aceptados, la región, la dificultad, una explicación y las fuentes. Las opciones incorrectas deben ser plausibles, pero no ambiguas. Antes de incluir accidentes óseos o inserciones puntuales será necesario confirmar que el modelo dispone de detalle suficiente para distinguirlos.
