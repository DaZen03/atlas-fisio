const fs = require('node:fs');
const path = require('node:path');
const { renderSiteMenu } = require('./site-menu.cjs');

const outDir = path.join(__dirname, '..', 'dist', 'guias');
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  {
    id: 'aprendizaje', nav: 'Ruta de aprendizaje', eyebrow: '01 · ORIENTACIÓN', title: 'Aprende por capas, conecta con el movimiento',
    intro: 'Una ruta con prerrequisitos: primero aprende el lenguaje y los tejidos; después construye esqueleto, articulaciones y músculos; al final integra regiones, fuerzas y tareas. Úsala como apoyo de estudio; no equivale a un programa universitario ni a una evaluación de competencias clínicas.',
    outcomes: ['Seguir un orden de estudio sin memorizar músculos aislados de su región.', 'Relacionar tejido, hueso, articulación, músculo, movimiento y tarea.', 'Explicar una variable mecánica y reconocer qué evidencia falta.'],
    sections: [
      { title: '1 · Lenguaje y orientación', text: 'Empieza por posición anatómica, regiones, términos direccionales, planos y ejes. Este vocabulario evita describir una estructura con referencias ambiguas.', points: ['Localiza anterior/posterior, medial/lateral y proximal/distal.', 'Relaciona cada plano con su eje perpendicular.', 'Describe qué segmento se mueve antes de nombrar músculos.'] },
      { title: '2 · Tejidos y organización', text: 'Distingue hueso, cartílago, ligamento, tendón, fascia y músculo antes de estudiar regiones. La estructura de cada tejido ayuda a entender qué función puede cumplir, pero no permite diagnosticar su estado en una persona.', points: ['Separa unión articular de unión músculo-tendinosa.', 'Diferencia producir tensión de transmitirla.', 'Conecta célula, tejido, órgano y sistema.'] },
      { title: '3 · Esqueleto y referencias', text: 'Estudia primero el esqueleto axial y luego el apendicular. Reconoce huesos y accidentes óseos como referencias para articulaciones y fijaciones.', points: ['Axial: cráneo, columna y caja torácica.', 'Apendicular: cinturas y extremidades.', 'Ubica la región completa antes de memorizar detalles.'] },
      { title: '4 · Articulaciones y movimiento', text: 'Cuando ya reconoces los huesos, identifica superficies, tipo articular, grados de libertad y movimientos permitidos. Diferencia el movimiento visible de la mecánica interna de las superficies.', points: ['Nombra huesos participantes y eje aproximado.', 'Distingue flexión, extensión, rotaciones y movimientos combinados.', 'Compara cadena abierta y cerrada según el apoyo distal.'] },
      { title: '5 · Músculo y fijaciones', text: 'Añade los músculos después de comprender la articulación que cruzan. Estudia trayecto, origen, inserción, línea de tracción, acción posible y papel como agonista, antagonista o estabilizador.', points: ['No memorices una acción sin observar la postura.', 'Relaciona arquitectura muscular con producción de fuerza.', 'Recuerda que un gesto real no aísla un único músculo.'] },
      { title: '6 · Integración por regiones', text: 'Repite el mismo orden —huesos, articulación, músculos y movimiento— en hombro y brazo, antebrazo y mano, tronco, pelvis y cadera, rodilla, pierna y pie.', points: ['Comienza con relaciones grandes y añade capas profundas.', 'Compara vistas anterior, lateral y posterior.', 'Explica una región con tus palabras antes de avanzar.'] },
      { title: '7 · Biomecánica', text: 'Una vez construida la anatomía regional, incorpora cinemática, fuerzas, momentos, palancas, brazos de momento y control neuromuscular. Mantén separados los datos medidos y las estimaciones del visor.', points: ['Describe primero; explica fuerzas después.', 'Dibuja eje, línea de fuerza y distancia perpendicular.', 'Compara cómo cambian longitud, ángulo, apoyo y carga.'] },
      { title: '8 · Tarea, función y razonamiento', text: 'Integra marcha, actividades diarias, entrenamiento y deporte. La CIF de la OMS recuerda que el funcionamiento ocurre en contexto; por eso una estructura no explica por sí sola una actividad o participación.', points: ['Observa fases, coordinación y compensaciones posibles.', 'Relaciona estructura y función con la meta de la tarea.', 'Formula hipótesis, contrasta fuentes y declara límites.'] },
      { title: 'Cómo estudiar cada módulo', text: 'World Physiotherapy propone alinear resultados, actividades y evaluación e integrar conocimiento teórico y práctico. En el atlas se traduce en un ciclo breve que puedes repetir en cada región.', points: ['Meta: escribe qué podrás explicar.', 'Localiza: señala la estructura en 3D.', 'Mueve: describe el gesto y sus fases.', 'Recupera: responde sin mirar y corrige con la fuente.'] }
    ],
    prompt: 'Sin mirar la ficha, describe en una frase qué movimiento ocurre en el codo al llevar una taza hacia la boca. Después identifica una estructura que guía el movimiento y una que contribuye a producirlo.',
    answer: 'Una respuesta inicial puede nombrar flexión del codo; el húmero y el cúbito/radio forman referencias articulares, mientras el bíceps y otros flexores contribuyen al gesto. La tarea no aísla un solo músculo: la carga, la postura del hombro y la estabilización también importan.',
    cta: ['../index.html#ruta-aprendizaje', 'Abrir la ruta del atlas'], sources: ['openstax','worldphysio','capte','icf']
  },
  {
    id: 'movimientos', nav: 'Movimientos', eyebrow: '02 · CINEMÁTICA', title: 'Describe el movimiento antes de explicar la causa',
    intro: 'Observa qué segmento cambia de posición, qué articulación participa, en qué plano predomina el gesto y qué otros segmentos ayudan a completar la tarea.',
    outcomes: ['Distinguir el movimiento visible de la explicación de fuerzas.', 'Usar términos comunes y anatómicos con precisión.', 'Comparar fases y reconocer los límites de una animación esquemática.'],
    sections: [
      { title: 'Orden de observación', text: 'Primero describe el resultado visible. Luego sitúa articulación, segmento y plano. Solo después formula una hipótesis sobre músculos y cargas. Así reduces el riesgo de confundir “qué se mueve” con “qué fuerza lo causa”.', points: ['Plano sagital: suele mostrar flexión y extensión.', 'Plano frontal: suele mostrar abducción y aducción.', 'Plano transversal: suele mostrar rotaciones.', 'Los gestos reales combinan planos; el plano indicado es el predominante.'] },
      { title: 'Fases y cadenas', text: 'En tareas cotidianas y deportes, el gesto suele incluir preparación, producción de fuerza, transición y control. Una articulación puede moverse mientras otras estabilizan o transfieren energía.', points: ['Señala el apoyo y la dirección de la tarea.', 'Compara el inicio, el tramo medio y el final.', 'Observa si el movimiento es de cadena abierta o cerrada según el apoyo distal.'] },
      { title: 'Aplicación para fisioterapia y entrenamiento', text: 'Usa el atlas para practicar la descripción del movimiento y generar preguntas. La animación no sustituye observación de personas, medición, evaluación ni razonamiento clínico.', points: ['¿Qué tarea quiere realizar la persona?', '¿Qué articulaciones participan y qué rango se observa?', '¿Qué aspecto cambiaría si cambia apoyo, carga o velocidad?'] }
    ],
    prompt: 'En una sentadilla, señala qué hacen cadera, rodilla y tobillo al bajar. ¿Qué plano describe mejor la mayor parte del desplazamiento y qué otros planos pueden aparecer?',
    answer: 'La bajada incluye flexión de cadera y rodilla y dorsiflexión del tobillo. Predomina el plano sagital, aunque la alineación y el movimiento tridimensional pueden incluir componentes frontales y transversales. La descripción depende de la técnica y la perspectiva observada.',
    cta: ['../index.html#explorar', 'Explorar movimientos en 3D'], sources: ['openstax','worldphysio','simulation']
  },
  {
    id: 'modelo-3d', nav: 'Modelo 3D', eyebrow: '03 · EXPLORACIÓN', title: 'Explora estructuras, capas y articulaciones',
    intro: 'El visor permite rotar el cuerpo, seleccionar estructuras, aislar regiones, cambiar capas y ensayar rangos visuales. Lee cada control como apoyo para observar relaciones espaciales.',
    outcomes: ['Encontrar una estructura por región o búsqueda.', 'Seguir juntos los segmentos vinculados al movimiento representado.', 'Separar capas con fines didácticos sin confundir la distancia visual con anatomía real.'],
    sections: [
      { title: 'Un recorrido práctico', text: 'Elige primero una articulación. Activa huesos y músculos, selecciona un gesto y mueve el control poco a poco. Después compara una vista anterior, lateral y posterior.', points: ['Selecciona región → estructura → movimiento.', 'Aísla con contexto para conservar referencias anatómicas vecinas.', 'Usa la separación muscular como vista de estudio; la distancia no es la posición anatómica.', 'Reinicia la vista antes de cambiar a otra región.'] },
      { title: 'Qué significa que las piezas acompañen', text: 'Los huesos siguen segmentos rígidos. Los músculos largos que cruzan articulaciones usan deformación localizada por zonas; los músculos muy cortos usan seguimiento rígido ponderado para no retorcerse. Ninguna estrategia representa contracción fisiológica, deslizamiento real de tendones ni fuerzas medidas.', points: ['Los pivotes y rangos son aproximados.', 'Los músculos resaltados son asociaciones didácticas.', 'El color o resaltado no mide activación ni esfuerzo.', 'Si una malla se separa o deforma, verifica la vista completa y consulta la nota de fidelidad.'] },
      { title: 'Buenas preguntas al observar', text: 'La exploración espacial es más útil si la acompañas con una pregunta concreta.', points: ['¿Qué huesos forman la articulación?', '¿Qué estructura cruza el eje?', '¿Qué cambia al modificar el ángulo?', '¿Qué parte del movimiento no está representada?'] }
    ],
    prompt: 'Apaga la capa muscular en el codo y vuelve a activarla. ¿Qué huesos forman la referencia articular? Luego mueve el antebrazo y di una limitación del modelo que debas recordar.',
    answer: 'El codo comprende relaciones entre húmero, ulna/cúbito y radio según la articulación considerada. La animación permite observar cambios espaciales, pero no mide la fuerza, no modela todas las articulaciones con exactitud clínica y no simula deformación muscular real.',
    cta: ['../index.html#explorar', 'Abrir visor 3D'], sources: ['bodyparts','three','worldphysio']
  },
  {
    id: 'estructuras', nav: 'Estructuras', eyebrow: '04 · ANATOMÍA FUNCIONAL', title: 'Conecta huesos, articulaciones y músculos',
    intro: 'La anatomía funcional estudia cómo la forma, las conexiones y la tarea se relacionan. El atlas organiza las estructuras por región y enlaza fichas con mallas seleccionables.',
    outcomes: ['Clasificar una estructura como hueso, articulación o músculo.', 'Describir origen e inserción como referencias del trayecto.', 'Relacionar una línea de tracción con un movimiento posible sin asumir que un músculo actúa solo.'],
    sections: [
      { title: 'De región a función', text: 'Empieza por la región; identifica los huesos y superficies articulares; luego sigue los músculos que cruzan la articulación y las acciones posibles.', points: ['Hueso: soporte y brazo de palanca; también transmite fuerzas.', 'Articulación: contacto y movimiento permitido, condicionado por tejidos y carga.', 'Músculo y tendón: generan y transmiten tensión; la acción depende de la línea de tracción y de qué segmento está estabilizado.'] },
      { title: 'Origen, inserción y línea de tracción', text: 'Origen e inserción son convenciones para describir fijaciones. En una tarea de cadena cerrada, el segmento fijado puede cambiar y la acción puede ser inversa. El nombre de las fijaciones no determina por sí solo la acción en toda postura.', points: ['Busca qué articulaciones cruza el músculo.', 'Observa qué segmento está libre y cuál soporta carga.', 'Considera el ángulo y la dirección de la resistencia.', 'Las mallas del atlas muestran formas generales; no miden puntos de inserción.'] },
      { title: 'Ejemplo: bíceps braquial', text: 'Cruza hombro y codo, se fija en el radio y puede contribuir a la flexión del codo y supinación del antebrazo. Su contribución varía con la postura, la tarea y los otros músculos activos.', points: ['Compara curl con una tarea de agarre.', 'Observa el antebrazo en pronación, neutro y supinación.', 'Pregunta qué otras estructuras colaboran y estabilizan.'] }
    ],
    prompt: '¿Por qué no basta con leer “el bíceps flexiona el codo” para predecir su contribución durante cualquier tarea?',
    answer: 'La contribución cambia con el ángulo articular, la orientación del antebrazo, la línea de tracción, la carga, la estabilización y la participación de sinergistas. La descripción anatómica orienta, pero no sustituye el análisis de la tarea.',
    cta: ['../index.html#estructuras', 'Buscar estructuras en el atlas'], sources: ['openstax','bodyparts','worldphysio']
  },
  {
    id: 'biomecanica', nav: 'Biomecánica', eyebrow: '05 · MECÁNICA DEL MOVIMIENTO', title: 'Explica cómo la carga cambia la demanda',
    intro: 'La biomecánica relaciona fuerzas, momentos, geometría y movimiento. En el atlas puedes variar el ángulo y observar esquemas de ejercicios, palancas y mecanismos de máquinas.',
    outcomes: ['Identificar eje, fuerza y brazo perpendicular.', 'Distinguir momento externo de la acción muscular interna.', 'Explicar por qué el mismo peso puede generar demandas distintas a lo largo del recorrido.'],
    sections: [
      { title: 'Momento de fuerza', text: 'El momento externo se estima con τ = F × d⊥: fuerza por distancia perpendicular entre la línea de acción y el eje. Si cambia el ángulo, puede cambiar esa distancia aunque el peso sea el mismo.', points: ['Localiza el eje articular.', 'Dibuja la dirección de la carga externa.', 'Mide conceptualmente la distancia perpendicular.', 'Compara posiciones sin afirmar que el visor mide fuerza real.'] },
      { title: 'Brazos interno y externo', text: 'El brazo externo describe la geometría de la resistencia respecto al eje. El brazo interno describe la geometría de la fuerza muscular. No son intercambiables y el atlas no mide brazos internos individuales desde las mallas.', points: ['En un curl, la carga en la mano cambia su distancia al codo.', 'La línea de tracción muscular también cambia con la postura.', 'La demanda articular neta depende de fuerzas, aceleración y co-contracción, entre otros factores.'] },
      { title: 'Máquinas y ejercicios', text: 'Poleas, levas y palancas alteran cómo la máquina transmite resistencia a lo largo del recorrido. Su efecto depende del diseño, ajustes, trayectoria y posición de la persona.', points: ['Compara el punto de aplicación de la fuerza.', 'Observa si la resistencia cambia con el ángulo.', 'Separa la ventaja mecánica del aparato del momento en una articulación.', 'Para entrenamiento, carga, técnica, fatiga y experiencia determinan el esfuerzo real.'] },
      { title: 'De la mecánica a la fisiología', text: 'Una carga externa crea una demanda mecánica. El sistema nervioso puede modificar el reclutamiento de unidades motoras y la frecuencia de activación para producir tensión; el resultado también depende de la tarea y del estado del músculo. El resaltado 3D no mide ninguno de estos procesos.', points: ['Unidad motora: neurona motora y fibras que inerva.', 'Mayor momento externo no identifica por sí solo cuánta tensión genera cada músculo.', 'Distingue la malla muscular macroscópica de las fibras y sarcómeros microscópicos.'] }
    ],
    prompt: 'Una carga vertical está en la mano con el codo extendido y luego con el codo flexionado. ¿Qué variable geométrica explica que el momento externo sobre el codo pueda cambiar?',
    answer: 'Cambia la distancia perpendicular entre el eje del codo y la línea de acción de la carga. El momento depende también de la magnitud y dirección de la fuerza; el ejemplo no estima el brazo interno del bíceps.',
    cta: ['../index.html#biomecanica', 'Aplicar casos biomecánicos'], sources: ['openstax','momentarm','machines','physiology']
  },
  {
    id: 'cuestionarios', nav: 'Cuestionarios', eyebrow: '06 · PRÁCTICA Y REPASO', title: 'Recupera la idea, recibe explicación, vuelve a intentarlo',
    intro: 'Los tests mezclan preguntas de anatomía y biomecánica por área. La respuesta se acompaña de explicación, referencias y un enlace a la zona relacionada del modelo.',
    outcomes: ['Elegir una pregunta adecuada a la región que estudias.', 'Responder primero desde la memoria y detectar lagunas.', 'Usar retroalimentación para decidir qué revisar a continuación.'],
    sections: [
      { title: 'Estudio activo en tres movimientos', text: 'Antes de abrir las opciones, intenta responder con tus propias palabras. Después contrasta la explicación y la fuente. Vuelve a observar el modelo cuando necesites reconstruir la relación espacial.', points: ['Evoca: responde sin mirar notas.', 'Explica: lee la retroalimentación y la referencia.', 'Repara: vuelve a la ficha o al gesto y repite otra pregunta.'] },
      { title: 'Áreas del atlas', text: 'Puedes centrarte en una región o usar una ronda mixta. Los ítems mezclan orden de preguntas y respuestas; no repiten la pregunta dentro de la misma ronda.', points: ['Cabeza y cuello.', 'Tronco.', 'Miembro superior.', 'Miembro inferior.', 'Biomecánica general y repaso mixto.'] },
      { title: 'Cómo interpretar el resultado', text: 'El número de aciertos informa sobre esa ronda, no certifica competencia, diagnóstico, razonamiento clínico ni preparación para tratar pacientes. Usa los errores para elegir qué volver a estudiar.', points: ['¿Falló el término, la estructura o la relación mecánica?', '¿Podrías explicarlo con otro ejemplo?', '¿Qué evidencia apoya la explicación?'] }
    ],
    prompt: 'Después de fallar una pregunta, escribe qué confundiste: término, ubicación anatómica, relación funcional o mecánica. Luego abre la zona en el modelo y explica la respuesta correcta con una frase propia.',
    answer: 'La reflexión convierte el resultado en un siguiente paso de estudio. No basta con memorizar la opción: intenta recuperar la idea y aplicarla a una situación ligeramente distinta.',
    cta: ['../index.html#cuestionarios', 'Practicar cuestionarios'], sources: ['khan','worldphysio','reasoning']
  },
  {
    id: 'verificacion', nav: 'Verificación', eyebrow: '07 · LECTURA CRÍTICA', title: 'Comprueba afirmaciones y límites del modelo',
    intro: 'Una imagen convincente no garantiza una anatomía precisa. Esta página enseña a revisar qué tipo de afirmación se hace, qué fuente la respalda y qué parte permanece aproximada.',
    outcomes: ['Separar dato anatómico, esquema y estimación.', 'Revisar una afirmación con fuentes apropiadas.', 'Explicar con transparencia qué no se ha medido ni validado clínicamente.'],
    sections: [
      { title: 'Una pauta de contraste', text: 'Define primero qué estás verificando. Luego compara términos, ubicación, función y contexto entre una fuente anatómica o educativa y otra referencia fiable, dando prioridad a documentos profesionales, organismos sanitarios y literatura revisada.', points: ['Afirmación específica: “qué estructura”, “qué acción” y “en qué contexto”.', 'Fuente apropiada al tipo de dato.', 'Fecha, población y alcance de la referencia.', 'Registro de discrepancias y límites en el atlas.'] },
      { title: 'Qué significa el registro de contraste', text: 'El registro del atlas resume afirmaciones seleccionadas y referencias para facilitar la revisión. No es una certificación externa, auditoría exhaustiva de todas las mallas ni autorización clínica.', points: ['La cantidad de fuentes no elimina sesgo ni errores.', 'Un artículo sobre una población concreta no se generaliza automáticamente.', 'Verifica de nuevo cuando la decisión tenga consecuencias clínicas.'] },
      { title: 'Límites funcionales', text: 'El modelo usa mallas reducidas y transformaciones didácticas. No captura movimiento de pacientes, mide fuerza o activación muscular, ni determina normalidad, patología o tratamiento.', points: ['Ángulos, pivotes, inserciones y trayectorias son aproximados.', 'Las animaciones deportivas son esquemas, no captura de atletas.', 'Los resaltados indican una asociación didáctica, no EMG o carga medida.'] }
    ],
    prompt: 'Si una animación muestra el tríceps resaltado durante un press, ¿qué puedes concluir y qué no puedes concluir?',
    answer: 'Puedes leerlo como una asociación funcional plausible dentro del esquema del atlas. No puedes inferir activación eléctrica, fuerza exacta, reclutamiento medido ni una recomendación individual de ejercicio.',
    cta: ['../index.html#verificacion', 'Abrir registro de contraste'], sources: ['worldphysio','who','apta']
  },
  {
    id: 'fuentes', nav: 'Fuentes', eyebrow: '08 · BIBLIOTECA', title: 'Elige la fuente según la pregunta',
    intro: 'No todas las fuentes sirven para responder lo mismo. Usa textos anatómicos para nomenclatura y relaciones; marcos profesionales para formación; investigación para métodos, tareas o resultados específicos.',
    outcomes: ['Clasificar una referencia por su propósito.', 'Rastrear la fuente enlazada a una ficha o movimiento.', 'Evitar presentar una malla o software como validación médica.'],
    sections: [
      { title: 'Fuentes para anatomía y movimiento', text: 'OpenStax es un recurso abierto para fundamentos anatómicos y fisiológicos. BodyParts3D aporta el origen de las mallas del visor; su licencia y formato no validan exactitud clínica del modelo.', points: ['OpenStax: estructura, planos, articulaciones y sistemas.', 'BodyParts3D: datos de malla y licencia de reutilización.', 'Revisa el texto de origen si una etiqueta del atlas no coincide con una fuente.'] },
      { title: 'Fuentes para formación en fisioterapia', text: 'World Physiotherapy presenta un marco internacional de educación y orientación curricular. La OMS publica un marco de competencias en rehabilitación para adaptar a contextos. APTA ofrece ejemplos de recursos educativos y resultados en el contexto de Estados Unidos.', points: ['Los marcos guían currículo y resultados; no son protocolos clínicos.', 'Los estándares regulatorios cambian según país.', 'El atlas no acredita un programa ni un profesional.'] },
      { title: 'Fuentes para mecánica y movimiento medido', text: 'Prioriza artículos revisados por pares y métodos con población y tareas descritas. Repositorios como OpenSim u OpenCap permiten estudiar herramientas de análisis, pero su existencia no certifica las animaciones del atlas.', points: ['Comprueba si el método mide cinemática, cinética o solo describe.', 'Lee limitaciones y tamaño de muestra.', 'Distingue evidencia de una fuente de la interpretación didáctica aquí presentada.'] }
    ],
    prompt: '¿Qué consultarías primero para confirmar la licencia de una malla GLB y qué consultarías para revisar la competencia profesional de entrada a la práctica?',
    answer: 'La ficha de licencia y procedencia de BodyParts3D para reutilización de la malla; un marco educativo o profesional como World Physiotherapy (o el regulador correspondiente a tu país) para competencias de entrada. Son preguntas distintas y requieren fuentes distintas.',
    cta: ['../index.html#fuentes', 'Abrir catálogo de fuentes'], sources: ['openstax','bodyparts','worldphysio','who','apta','ebp']
  },
  {
    id: 'fidelidad', nav: 'Formato y fidelidad', eyebrow: '09 · MEDIOS Y ALCANCE', title: 'Qué aportan las mallas y qué no pueden demostrar',
    intro: 'El formato 3D facilita rotar, comparar y seleccionar estructuras. La calidad educativa depende también del origen de los datos, la claridad de las etiquetas, el movimiento y las limitaciones declaradas.',
    outcomes: ['Distinguir interoperabilidad técnica de validación anatómica.', 'Reconocer qué partes del atlas provienen de mallas y cuáles son animación didáctica.', 'Elegir el visor adecuado para una pregunta de estudio.'],
    sections: [
      { title: 'Malla anatómica y formato', text: 'GLB es una forma práctica de distribuir escenas y geometría 3D. El formato conserva datos de representación, no demuestra por sí mismo que la anatomía sea completa, clínicamente validada o adecuada para diagnóstico.', points: ['BodyParts3D aporta las mallas con la licencia atribuida en el atlas.', 'La reducción poligonal ayuda al rendimiento y puede simplificar detalles.', 'La visualización depende de navegador, WebGL, tamaño y dispositivo.'] },
      { title: 'Comparar vistas con una intención', text: 'El HTML autónomo facilita abrir el atlas sin servidor; la versión del sitio estático puede cargar archivos separados y compartir páginas. Elige la vista según necesites interacción, lectura o referencia bibliográfica.', points: ['Vista 3D: orientación espacial y selección.', 'Fichas: texto, acción y fuentes.', 'Guías por sección: introducción, secuencia de estudio y autoevaluación.'] },
      { title: 'Uso responsable en clase', text: 'Para una práctica educativa, especifica la pregunta, la versión del atlas y qué elementos son aproximados. Contrasta con atlas y materiales oficiales de tu institución cuando la precisión detallada sea necesaria.', points: ['No uses el visor como dispositivo de diagnóstico.', 'No infieras fuerzas, contracción o lesión a partir de un resaltado.', 'Incluye la atribución de BodyParts3D al redistribuir el material.'] }
    ],
    prompt: '¿Un archivo GLB conforme a una especificación 3D demuestra que su contenido anatómico está certificado?',
    answer: 'No. Una especificación de formato se ocupa de cómo se estructura e intercambia la escena. La procedencia, exactitud y validación anatómica requieren evidencia separada.',
    cta: ['../index.html#formatos', 'Ver formatos y atribuciones'], sources: ['gltf','bodyparts','worldphysio']
  }
];

const references = {
  worldphysio: ['World Physiotherapy · marco educativo del fisioterapeuta', 'https://www.world.physio/what-we-do/education/physiotherapist-education-framework'],
  capte: ['CAPTE · estándares para formación de fisioterapia', 'https://www.capteonline.org/globalassets/capte-docs/2024-capte-pt-standards-required-elements.pdf'],
  icf: ['OMS · Clasificación Internacional del Funcionamiento (CIF)', 'https://www.who.int/classifications/international-classification-of-functioning-disability-and-health'],
  who: ['OMS · Marco de Competencias para la Rehabilitación', 'https://www.who.int/es/publications/b/54312'],
  openstax: ['OpenStax · Anatomía y Fisiología', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction'],
  physiology: ['OpenStax · unidades motoras y control de la tensión', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/10-4-nervous-system-control-of-muscle-tension'],
  apta: ['APTA · resultados esenciales de competencia para entrada a la práctica', 'https://www.apta.org/apta-and-you/news-publications/reports/2025/therapy-essential-outcomes-physical-therapist-entrance-into-practice'],
  ebp: ['APTA · recursos de práctica basada en evidencia para educadores', 'https://www.apta.org/for-educators/curriculum-resources/ebp-research'],
  reasoning: ['Revisión sistemática · razonamiento clínico en estudiantes de fisioterapia', 'https://doi.org/10.1093/ptj/pzae182'],
  simulation: ['Revisión sistemática · simulación en formación de fisioterapia', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4407134/'],
  khan: ['Khan Academy · práctica, retroalimentación y dominio', 'https://www.khanacademy.org/khan-for-educators/k4e-us-demo/xb78db74671c953a7%3Aget-to-know-khan-academy/xb78db74671c953a7%3Awelcome-to-khan-academy-1/v/the-ai-enhanced-mastery-learning-approach'],
  bodyparts: ['BodyParts3D · descarga de datos', 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html'],
  three: ['Three.js · documentación', 'https://threejs.org/docs/'],
  momentarm: ['Revisión de brazos de momento musculares y articulaciones', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4404026/'],
  machines: ['OpenStax · sistemas de palancas musculares', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-1-interactions-of-skeletal-muscles-their-fascicle-arrangement-and-their-lever-systems'],
  gltf: ['Khronos Group · especificación glTF 2.0', 'https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html']
};

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for (const current of pages) {
  const activePrimary = current.id === 'aprendizaje' || current.id === 'movimientos' ? 'learn' : ['modelo-3d','estructuras'].includes(current.id) ? 'atlas' : current.id === 'biomecanica' ? 'biomechanics' : current.id === 'cuestionarios' ? 'practice' : ['verificacion','fuentes','fidelidad'].includes(current.id) ? 'sources' : '';
  const activeMenu = {learn:'aprender',atlas:'explorar',biomechanics:'biomecanica',practice:'practicar',sources:'fuentes'}[activePrimary] || '';
  const nav = renderSiteMenu('../', activeMenu);
  const sections = current.sections.map((s, i) => `<section class="guide-section" id="tema-${i+1}"><span class="guide-index">TEMA ${String(i+1).padStart(2,'0')}</span><h2>${escapeHtml(s.title)}</h2><p>${escapeHtml(s.text)}</p><ul>${s.points.map(point => `<li>${escapeHtml(point)}</li>`).join('')}</ul></section>`).join('');
  const sources = [...new Set(current.sources)].map(key => { const [label,url] = references[key]; return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a></li>`; }).join('');
  const prev = pages[(pages.indexOf(current) + pages.length - 1) % pages.length];
  const next = pages[(pages.indexOf(current) + 1) % pages.length];
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#102324">
  <meta name="description" content="Guía educativa de ${escapeHtml(current.nav.toLowerCase())} para estudiar anatomía funcional y fisioterapia con el atlas del movimiento humano.">
  <title>${escapeHtml(current.nav)} · Atlas del movimiento humano</title><link rel="stylesheet" href="../guide-pages.css"><link rel="stylesheet" href="../site-menu.css">
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <header class="guide-header"><a class="guide-brand" href="../index.html"><span>✳</span> ATLAS/MOVIMIENTO</a>${nav}<button class="theme-toggle" type="button" aria-pressed="false">☾ <span>Modo oscuro</span></button></header>
  <main id="contenido">
    <p class="breadcrumb"><a href="../index.html">Inicio</a> / Guías / ${escapeHtml(current.nav)}</p>
    <section class="guide-hero"><div class="eyebrow">${escapeHtml(current.eyebrow)} · GUÍA DE ESTUDIO</div><h1>${escapeHtml(current.title)}</h1><p class="lead">${escapeHtml(current.intro)}</p><div class="outcomes"><h2>Al finalizar esta guía podrás</h2><ul>${current.outcomes.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div></section>
    <div class="guide-layout"><article class="guide-content">${sections}
      <section class="active-recall"><span class="guide-index">PONLO A PRUEBA</span><h2>${escapeHtml(current.prompt)}</h2><details><summary>Mostrar una respuesta orientativa</summary><p>${escapeHtml(current.answer)}</p></details><a class="primary-link" href="${current.cta[0]}">${escapeHtml(current.cta[1])} ↗</a></section>
      <section class="guide-sources"><span class="guide-index">FUENTES Y SIGUIENTE PASO</span><h2>Comprueba y continúa</h2><p>Estas referencias orientan el contenido. Revisa el documento original y el contexto de aplicación antes de trasladar una idea a la práctica profesional.</p><ul>${sources}</ul><div class="guide-pagination"><a href="${prev.id}.html">← ${escapeHtml(prev.nav)}</a><a href="${next.id}.html">Siguiente: ${escapeHtml(next.nav)} →</a></div></section>
    </article><aside class="guide-aside"><div class="aside-card"><span class="guide-index">RUTA BREVE</span><ol><li>Lee el objetivo.</li><li>Estudia un tema.</li><li>Responde sin mirar.</li><li>Contrasta y repasa.</li></ol></div><div class="aside-card aside-cta"><strong>¿Listo para verlo?</strong><p>Abre la parte interactiva del atlas y vuelve a esta guía para comprobar tus ideas.</p><a href="${current.cta[0]}">${escapeHtml(current.cta[1])} ↗</a></div><p class="scope-note">Recurso académico de apoyo. No sustituye formación supervisada, evaluación de pacientes ni protocolos locales.</p></aside></div>
  </main>
  <footer class="guide-footer"><a href="../index.html">Volver al atlas completo</a><span>Uso académico · Atlas del movimiento humano</span></footer>
  <script>const toggle=document.querySelector('.theme-toggle');const root=document.documentElement;try{if(localStorage.getItem('atlas-theme')==='dark')root.dataset.theme='dark'}catch{}function sync(){const dark=root.dataset.theme==='dark';toggle.setAttribute('aria-pressed',String(dark));toggle.innerHTML=dark?'☀ <span>Modo claro</span>':'☾ <span>Modo oscuro</span>'}sync();toggle.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('atlas-theme',root.dataset.theme)}catch{}sync()});</script>
</body></html>`;
  const sectionRoutes={
    'ruta-aprendizaje':'../vistas/aprender.html',explorar:'../vistas/explorar.html',
    biomecanica:'../biomecanica/index.html',cuestionarios:'../vistas/practicar.html',
    estructuras:'../vistas/estructuras.html',verificacion:'../vistas/verificacion.html',
    formatos:'../vistas/formatos.html',fuentes:'../vistas/fuentes.html'
  };
  let routedHtml=html;
  for(const [anchor,route] of Object.entries(sectionRoutes))routedHtml=routedHtml.replaceAll(`../index.html#${anchor}`,route);
  fs.writeFileSync(path.join(outDir, `${current.id}.html`), routedHtml);
}
console.log(`Generadas ${pages.length} guías en ${outDir}`);
