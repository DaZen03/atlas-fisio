# Plan del módulo de inserciones y tendones

## Propósito

Crear un recorrido académico que conecte músculo, unión miotendinosa, tendón o aponeurosis, entesis, hueso y movimiento. El módulo está orientado a estudiantes iniciales de fisioterapia y entrenadores; no pretende localizar lesiones, sustituir disección ni ofrecer coordenadas clínicas.

## Orden didáctico

1. Diferenciar músculo, tendón, aponeurosis, ligamento y fascia.
2. Reconocer la articulación y los huesos de la región.
3. Seguir el vientre muscular de proximal a distal.
4. Identificar origen e inserción como convenciones descriptivas.
5. Localizar la región ósea de fijación y explicar la línea de tracción.
6. Mover la articulación y comparar cómo cambia la orientación del trayecto.
7. Relacionar el trayecto con brazo de momento y función, sin inferir fuerza real.

## Estado implementado

- Página independiente y responsiva en `dist/inserciones/index.html`.
- Seis recorridos: hombro, codo, cadera, rodilla y tobillo anterior/posterior.
- Capa opcional de conexiones doradas en el atlas.
- Apertura del visor con `?inserciones=1`, músculos semitransparentes y plano oculto.
- 191 relaciones entre segmentos incluidas en la auditoría geométrica.
- Glosario de tendón, aponeurosis, entesis, unión miotendinosa y ligamento.

Las conexiones actuales son guías geométricas. No son mallas de tendón ni señalan una superficie exacta de entesis.

## Modelo de datos propuesto

Cada elemento del futuro catálogo debería incluir:

```json
{
  "id": "tendon-calcaneo",
  "nombre": "Tendón calcáneo",
  "nombreComun": "Tendón de Aquiles",
  "region": "pierna-pie",
  "musculos": ["gastrocnemius", "soleus"],
  "huesos": ["calcaneus"],
  "fijacionProximal": "Continuidad con el tríceps sural",
  "fijacionDistal": "Cara posterior del calcáneo",
  "tipo": "tendon",
  "entesis": "fibrocartilaginosa",
  "movimientos": ["plantar"],
  "malla": null,
  "precision": "regional",
  "fuentes": ["openstax", "enthesis-review"],
  "revisado": false
}
```

`precision` debe distinguir una descripción textual, una región aproximada y una superficie validada. La interfaz nunca debe dibujar un marcador “exacto” cuando solo existe evidencia regional.

## Fases de implementación

### Fase 1 · Catálogo verificable

- Priorizar tendón calcáneo, patelar/cuádriceps, bíceps distal, tríceps, manguito rotador, tibial anterior, isquiotibiales y glúteos.
- Separar tendones, aponeurosis, retináculos y ligamentos en categorías distintas.
- Guardar fuente, alcance, variante anatómica y fecha de revisión.
- Añadir fichas y cuestionarios de reconocimiento regional.

### Fase 2 · Marcadores anatómicos

- Crear marcadores diferenciados para fijación proximal, distal y entesis.
- Vincular cada marcador a una superficie ósea o a un punto regional documentado.
- Mantener los marcadores unidos al esqueleto durante todas las animaciones.
- Permitir ocultar el vientre muscular sin perder hueso, tendón y etiqueta.

### Fase 3 · Mallas de tendón

- Buscar conjuntos abiertos que incluyan tendones segmentados, licencia redistribuible y procedencia documentada.
- Comprobar escala, orientación, nomenclatura, lateralidad y correspondencia con BodyParts3D.
- Importar por regiones; no mezclar modelos humanos diferentes sin registro explícito.
- Mantener una alternativa ligera para móviles.

### Fase 4 · Validación y evaluación

- Auditoría automatizada de continuidad en postura neutra y durante movimientos.
- Revisión anatómica independiente de nombre, región y fijaciones.
- Pruebas visuales anterior, posterior y lateral en escritorio y móvil.
- Preguntas que exijan localizar, seguir el trayecto y explicar función.

La futura capa de cartílagos, discos y meniscos se especifica por separado en `docs/plan-cartilagos-articulaciones.md`. Debe reutilizar la misma auditoría de segmentos, pero mantenerse diferenciada de tendones, entesis y ligamentos tanto en datos como en la interfaz.

## Criterios de aceptación

- Toda estructura tiene fuente y nivel de precisión visible.
- Ninguna línea o malla queda fija cuando se mueve su segmento asociado.
- No se presenta el color como activación, carga o lesión.
- El modo aislado conserva al menos músculo, tendón aproximado y huesos de referencia.
- Los términos científicos incluyen una explicación común sin reemplazar la nomenclatura anatómica.

## Fuentes base

- OpenStax, *Anatomy and Physiology 2e*, sección 10.2: continuidad de tejidos musculares, tendón, periostio y aponeurosis.
- IFAA/FIPAT, *Terminologia Anatomica Humana*: nomenclatura anatómica internacional.
- Killian, *Growth and mechanobiology of the tendon-bone enthesis*, Journal of Orthopaedic Research (2022).
- BodyParts3D: procedencia y licencia de las mallas actuales.
