# Auditoría de mallas, movimiento y biomecánica

Fecha de revisión: 30 de octubre de 2026.

## Decisión técnica

El atlas mantendrá separadas tres responsabilidades:

1. **Anatomía visible:** BodyParts3D como referencia principal de forma, lateralidad e identificadores anatómicos.
2. **Capas complementarias:** Z-Anatomy solo para estructuras ausentes, después de revisar la licencia específica de cada objeto y conservar la atribución CC BY-SA.
3. **Movimiento y biomecánica:** OpenSim para contrastar articulaciones, segmentos rígidos, rutas músculo-tendón y brazos de momento. Una malla anatómica no se considera automáticamente un modelo biomecánico validado.

No se incorporará una colección completa solo porque tenga más polígonos. Cada lote nuevo debe conservar nombre normalizado, lado, región, fuente, licencia, relación jerárquica y segmento del rig. Las piezas que no puedan asignarse de manera segura quedan como capa estática hasta tener una unión validada.

## Candidatos examinados

| Fuente | Utilidad | Fidelidad y movimiento | Licencia / riesgo | Decisión |
|---|---|---|---|---|
| BodyParts3D 4.x | Huesos y músculos segmentados con conceptos FMA | Buena referencia morfológica; no trae rig dinámico | CC BY 4.0 en las distribuciones actuales; conservar procedencia | Base actual y primera fuente para completar cobertura |
| Z-Anatomy oficial | Más capas, estructuras bilaterales y detalle educativo | Deriva en gran parte de BodyParts3D; no asumir que cada objeto está preparado para animación | CC BY-SA 4.0, con excepciones NC en algunos objetos | Importar por lotes, excluyendo cualquier activo incompatible |
| Écorché | Aproximadamente 575 huesos, cartílagos y músculos ya preparados en glTF | Útil como referencia de nombres y conversión web; declara precisión de pocos milímetros y no tiene rig | Modelo CC BY-SA 4.0 | Candidato de prueba, no sustitución automática |
| OpenSim | Modelos musculoesqueléticos, articulaciones, músculos y trayectorias | Adecuado para validar cinemática y rutas músculo-tendón; no aporta superficies anatómicas completas | Revisar licencia de cada modelo | Referencia biomecánica y futura importación de rutas |

## Pipeline requerido para añadir mallas

1. Descargar desde la fuente oficial y registrar URL, revisión, licencia y hash.
2. Excluir órganos u objetos con cláusulas no comerciales si no forman parte del objetivo musculoesquelético.
3. Normalizar nombres contra Terminologia Anatomica/FMA y conservar el nombre original en metadatos.
4. Alinear a la postura anatómica y al sistema de coordenadas del atlas.
5. Detectar duplicados, componentes sueltos, normales invertidas y geometría no manifold.
6. Asignar cada hueso a un segmento rígido y cada músculo a dos o más anclajes anatómicos.
7. Validar origen, inserción, lateralidad y articulación cruzada antes de permitir animación.
8. Crear tres niveles de detalle: escritorio cercano, escritorio general y móvil.
9. Convertir a glTF/GLB; usar compresión de geometría solo después de medir tiempo de descarga y decodificación.
10. Ejecutar pruebas de separación de mallas en todos los extremos del rango y una inspección visual anterior, posterior y lateral.

## Criterios de rendimiento

- El GLB actual pesa cerca de 58 MB; antes de sumar otra colección completa se debe dividir por capas o regiones.
- El visor reduce la resolución de renderizado en móvil y equipos con poca memoria, y pausa el render cuando la pestaña está oculta.
- Las mallas pequeñas deben cargarse bajo demanda por región; el cuerpo completo conserva un nivel de detalle reducido.
- Draco puede reducir transferencia, pero añade coste de decodificación. Debe compararse con Meshopt en teléfonos reales antes de elegir.

## Ruta de ampliación biomecánica

1. **Cinemática:** ángulo articular, plano, eje, trayectoria y velocidad.
2. **Cinética externa:** masa, gravedad, reacción del suelo y brazo externo.
3. **Modelo interno:** brazo de momento muscular dependiente del ángulo, fuerza músculo-tendón y contacto articular.
4. **Interpretación:** separar lo medido, lo calculado y lo inferido; nunca presentar el resaltado como activación real.
5. **Validación:** comparar secuencias con modelos OpenSim publicados y documentar qué grados de libertad se simplifican.

## Fuentes primarias y técnicas

- BodyParts3D / DBCLS: <https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html>
- Z-Anatomy oficial: <https://github.com/Z-Anatomy/Models-of-human-anatomy>
- OpenSim, modelos y datos: <https://opensimconfluence.atlassian.net/wiki/spaces/OpenSim/pages/53086030/Models+Data+Utilities>
- Three.js DRACOLoader: <https://threejs.org/docs/pages/DRACOLoader.html>
- MediaPipe Pose Landmarker para Web: <https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js>

El atlas sigue siendo material académico. No constituye un dispositivo médico ni valida diagnóstico, rehabilitación o técnica individual.
