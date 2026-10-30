# Plan de capa de cartílagos y superficies articulares

## Propósito y límite

Añadir una capa académica que permita distinguir cartílago articular hialino, fibrocartílago, discos, meniscos y cartílago costal sin confundirlos con hueso, tendón o ligamento. La capa servirá para estudiar relaciones espaciales y movimiento; no estimará desgaste, presión, lesión ni espesor clínico.

La primera versión debe heredar el movimiento de los segmentos ya auditados. No se importará una malla si su procedencia, escala, lateralidad o licencia no puede verificarse.

## Orden de incorporación

1. **Superficies sinoviales principales:** cabeza humeral y glenoides; cabeza femoral y acetábulo; cóndilos femorales, mesetas tibiales y superficie femoropatelar; talo y mortaja tibiofibular.
2. **Fibrocartílagos didácticos:** meniscos de rodilla, disco temporomandibular y complejo fibrocartílago triangular de la muñeca (TFCC).
3. **Columna y pelvis:** discos intervertebrales y sínfisis púbica, separados de las superficies sinoviales.
4. **Tórax:** cartílagos costales, con una categoría propia porque unen costillas y esternón y no son cartílago articular de una articulación sinovial.
5. **Detalle opcional posterior:** labrum glenoideo y acetabular, solo si existen mallas abiertas compatibles o una reconstrucción documentada.

OpenStax describe el cartílago articular como una capa de cartílago hialino que recubre las superficies de las articulaciones sinoviales. También diferencia discos y meniscos de fibrocartílago, incluidos los meniscos de rodilla y los discos de la articulación temporomandibular y del extremo distal radiocubital. Los discos intervertebrales y la sínfisis púbica pertenecen a articulaciones cartilaginosas y deben aparecer en otra subcategoría. El TFCC requiere especial cautela: es un complejo fibrocartilaginoso y ligamentoso, no una sola lámina genérica.

## Modelo de datos

```json
{
  "id": "cartilage-knee-medial-meniscus-r",
  "nombre": "Menisco medial derecho",
  "nombreComun": "almohadilla interna de la rodilla",
  "tejido": "fibrocartilago",
  "categoria": "menisco",
  "region": "rodilla-derecha",
  "huesosRelacionados": ["femur-r", "tibia-r"],
  "segmentoRig": "knee",
  "articulacion": "knee",
  "movilidad": "seguimiento-aproximado",
  "malla": null,
  "precision": "regional",
  "licencia": null,
  "fuentes": ["openstax-synovial-joints"],
  "revisado": false
}
```

`precision` deberá usar solo `didactica`, `regional` o `superficie-validada`. Una geometría regional no podrá mostrarse como espesor real ni como contacto exacto.

## Integración con inserciones y tendones

- Conservar capas independientes: **huesos**, **cartílago**, **músculos**, **tendones/entesis**, **ligamentos** y **referencias**.
- Una entesis se vinculará a la superficie ósea anfitriona, no al cartílago articular.
- Cada tendón tendrá un segmento proximal y uno distal; si cruza una articulación, su trayectoria deberá pasar la auditoría de continuidad en todo el recorrido.
- El modo aislado conservará músculo, tendón aproximado, entesis y huesos de referencia; el cartílago se mostrará solo si pertenece a la articulación estudiada.
- El TFCC se catalogará como complejo mixto y no como inserción muscular.

## Arquitectura técnica

1. Crear `dist/assets/cartilage-manifest.json` con nombres, tejido, articulación, segmento, lado, fuente, licencia y precisión.
2. Añadir `cartilage` como capa visual con material azul verdoso translúcido y borde seleccionable; el color no indicará patología.
3. Conectar cada malla al mismo nodo del rig que su superficie ósea anfitriona. Las estructuras entre dos segmentos usarán una regla explícita y una prueba propia; no una mezcla automática.
4. Incorporar la capa al buscador, aislamiento, selección táctil, fichas y reto anatómico.
5. Mantener una versión móvil ligera, cargada por región y no como una segunda anatomía completa.

## Auditoría obligatoria

- Validar identificador, nomenclatura, lado y tipo de tejido.
- Comprobar postura neutra y extremos de flexión, extensión y rotación de cada articulación.
- Medir deriva del centro articular y separación de superficies vinculadas.
- Confirmar que ocultar músculos no oculta cartílago o inserciones seleccionadas.
- Probar vistas anterior, posterior y lateral en escritorio y móvil.
- Bloquear el build si una malla carece de fuente/licencia o apunta a un segmento inexistente.

## Criterios de aceptación

- Ningún cartílago, tendón o marcador de entesis queda fijo cuando se mueve su segmento.
- Ninguna estructura cruza a una articulación vecina por error de escala u orientación.
- El usuario puede diferenciar cartílago hialino, fibrocartílago, tendón, entesis y ligamento.
- La interfaz muestra el nivel de precisión y la limitación didáctica.
- La suma de nuevas mallas no impide interacción fluida en móvil; las regiones pesadas se cargan bajo demanda.

## Fuentes iniciales

- OpenStax, *Anatomy and Physiology 2e*, 9.4 **Synovial Joints**: cartílago articular, discos, meniscos, bursas y vainas tendinosas.
- OpenStax, *Anatomy and Physiology 2e*, 9.3 **Cartilaginous Joints**: cartílago costal, sínfisis púbica y discos intervertebrales.
- NCBI Bookshelf, *Anatomy, Shoulder and Upper Limb, Forearm Triangular Fibrocartilage Complex*: componentes y función estabilizadora del TFCC.
- BodyParts3D y cualquier nuevo conjunto de mallas: procedencia y licencia verificadas antes de redistribuir.
