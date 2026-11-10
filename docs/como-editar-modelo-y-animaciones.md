# Cómo modificar el modelo y sus movimientos

El atlas separa la **forma anatómica** de la **animación**. Cambiar una descripción, un gesto o una malla requiere editar archivos distintos.

| Quieres cambiar… | Archivo principal | Qué modificar |
| --- | --- | --- |
| Nombre, descripción, articulación, músculos destacados o fuentes de un gesto básico | `dist/data.js` | La entrada con su `id` en `movements`; mantiene el mismo identificador para los enlaces. |
| Fases de un gesto cotidiano, deportivo o de gimnasio | `dist/extra-movements.js` | La entrada en `extraMovements` y, si existe, sus posiciones en `dailyPhases` o `sportPhases`. Los valores van de 0 a 100 % del recorrido. |
| Posición real de los segmentos durante la reproducción | `dist/app.js` | `applyPose`, `applyExamplePose`, `groundedPose` y los pivotes del cuerpo. Aquí se decide qué huesos y músculos siguen cada articulación. |
| Forma o cantidad de piezas anatómicas | `dist/assets/bodyparts.glb` | Sustituir o regenerar la geometría junto con `bodyparts-manifest.json` y, si cambian los ejes, `bodyparts-joints.json`. Mantener nombre, licencia y atribución de cada fuente. |
| Ruta músculo–articulación y deformación | `dist/app.js` | `muscleAnchors`, `convertToSkinnedMuscle` y el seguimiento de músculos. Revisar el gesto completo después de cambiar cualquier anclaje. |
| Texto y enlace de la biblioteca de ejercicios | `dist/exercises.js` | La ficha del ejercicio; `movement` debe coincidir con un `id` definido en el atlas. |
| Diseño del visor o controles | `dist/index.html` y las hojas CSS de `dist/` | Después se generan las páginas de `dist/vistas/`. No editar solo una vista generada porque la siguiente compilación la reemplaza. |

## Ejemplo: cambiar la bisagra de cadera

1. En `dist/data.js`, localiza `id:'hiphinge'`. Cambia el texto o el rango didáctico `maxAngle` si corresponde. Ese número no cambia por sí solo la geometría de la pose.
2. En `dist/app.js`, localiza `hipHingePose`. Allí `groundedPose(value,55,-8,12)` define la inclinación visual del tronco, el ajuste del muslo y la flexión de rodilla. Cambia estos valores con cuidado para conservar los pies apoyados.
3. Revisa los gestos relacionados `pickup`, `deadlift` y `rdl` en `dist/extra-movements.js`. Tienen recorridos propios y no heredan automáticamente los mismos ángulos de la bisagra básica.
4. Si cambias la malla o los puntos de giro, actualiza también el manifiesto y los pivotes; una malla GLB nueva no se anima correctamente solo por tener la misma forma.
5. Ejecuta `npm run build` y `npm test`. Abre `dist/vistas/animaciones.html` y prueba inicio, mitad y final del recorrido con los músculos y huesos visibles. Repite en móvil.

## Comprobaciones antes de publicar

- En el visor, elige cada movimiento y comprueba que el segmento descrito es el que se mueve. En gestos globales, usa la vista lateral para seguir tronco, pelvis, rodilla y pies.
- Si la barra avanza pero el gesto parece inmóvil, revisa el encuadre y el plano de vista antes de cambiar los ángulos. Si el avance es demasiado lento en un equipo con pocos fotogramas por segundo, revisa `playbackAdvance` en `dist/app.js`.
- `test-movement-playback.mjs` comprueba que los 46 gestos cambian su pose y que las fichas de ejercicios apuntan a movimientos existentes. `test-hip-hinge.mjs` revisa la posición de los pies durante bisagra y sentadilla. `diagnose-motion-rig.mjs` inspecciona las relaciones entre mallas, músculos y huesos.
- Estas pruebas detectan errores geométricos, pero no sustituyen una revisión visual en navegador ni validan precisión clínica. Si un gesto parece inmóvil, verifica primero el encuadre, la barra de progreso, la velocidad y si el visor terminó de cargar.

El sitio se publica desde los archivos generados en `dist/`. La publicación en GitHub Pages requiere subir los cambios a GitHub; compilar y probar localmente no los publica.
