import fs from 'node:fs';
import { structures, sources } from '../dist/data.js';

const muscles = structures.filter(item => item.type.startsWith('MÚSC'));
const escapeCell = value => String(value).replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
const evidenceLinks = item => item.sources
  .filter(id => id !== 'bodyparts' && sources[id])
  .map(id => `[${sources[id].label}](${sources[id].url})`);

const lines = [
  '# Auditoría de las fichas musculares',
  '',
  `Revisión del catálogo actual: **${muscles.length} fichas musculares y de grupos musculares**. Se comprobaron las denominaciones, los términos de fijación y recorrido, las acciones descritas y los detalles funcionales frente a las referencias anatómicas regionales y específicas enlazadas en cada fila.`,
  '',
  'Las acciones se describen como contribuciones habituales, porque cambian con la posición, la tarea y el segmento fijado. Las fichas de grupos reúnen músculos relacionados y no sustituyen una descripción individual de cada vientre o fascículo. Las mallas son representaciones didácticas: no certifican precisión clínica, activación, fuerza ni deformación fisiológica.',
  '',
  'La referencia BodyParts3D se cita solo para procedencia/licencia y representación de mallas; no se usa como prueba de función muscular. Las referencias anatómicas de cada fila son las fuentes empleadas para comprobar sus afirmaciones.',
  '',
  '## Ajustes derivados de la comprobación',
  '',
  '- Se sustituyó la referencia mal etiquetada del deltoides por las fichas NCBI de deltoides y abductores del brazo.',
  '- Se precisó que la cabeza corta del bíceps femoral no cruza ni extiende la cadera.',
  '- Se matizó el tendón del iliopsoas: la unión de psoas mayor e ilíaco suele formar el tendón común, con variaciones anatómicas y posible ausencia del psoas menor.',
  '- Se describieron por separado las acciones opuestas de esternocleidomastoideo y esplenio.',
  '- Se especificó la rotación superior escapular coordinada por trapecio y serrato anterior.',
  '- Se corrigió la descripción del suelo pélvico para distinguir el elevador del ano y el coccígeo, sin llamarlos capas musculares homogéneas.',
  '- Se añadieron referencias específicas para músculos oculares, faríngeos, laríngeos y linguales, y se aclararon las acciones de cada grupo.',
  '- Se evitó asignar a los escalenos una dirección única de rotación cervical, porque las fuentes describen su contribución de manera variable; se conservaron inclinación lateral, flexión bilateral y elevación costal como acciones generales.',
  '- Se distinguieron los interespinosos de los rotadores vertebrales y se precisó la diferencia habitual entre rotadores breves (un nivel) y largos (dos niveles).',
  '- Se aclaró que la abducción y aducción de los dedos por los interóseos toma como referencia el dedo medio, y se completó la relación de grupos intrínsecos de la mano.',
  '',
  '## Registro por ficha',
  '',
  '| Ficha | Descripción y función verificadas | Fuentes anatómicas |',
  '|---|---|---|',
];

for (const item of muscles) {
  const claim = escapeCell(`${item.text} ${item.fact}`);
  const refs = evidenceLinks(item).join('; ');
  lines.push(`| ${escapeCell(item.name)} | ${claim} | ${refs} |`);
}

const output = new URL('../dist/auditoria-musculos.md', import.meta.url);
fs.writeFileSync(output, `${lines.join('\n')}\n`, 'utf8');
console.log(`Auditoría escrita: ${muscles.length} fichas musculares, con referencias anatómicas por ficha.`);
