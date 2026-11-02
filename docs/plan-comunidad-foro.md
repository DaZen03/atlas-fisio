# Plan de comunidad y foro con citas del atlas

Fecha: 1 de noviembre de 2026.

## Objetivo

Añadir una sección de comunidad donde cualquier visitante pueda leer discusiones y cualquier persona con una cuenta verificada pueda crear temas, responder, reaccionar y citar contenido concreto del atlas.

La comunidad será material académico. No sustituirá evaluación médica, diagnóstico, prescripción de ejercicio ni atención profesional.

## Decisión de arquitectura

### Frontend

- Mantener GitHub Pages para publicar los HTML, CSS, JavaScript y modelos 3D.
- Crear páginas independientes para evitar saturar el visor:
  - `vistas/comunidad.html`: portada, categorías y temas recientes.
  - `vistas/tema.html?id=...`: conversación completa.
  - `vistas/perfil.html?id=...`: perfil público y contribuciones.
  - `vistas/normas-comunidad.html`: reglas, alcance académico y privacidad.
  - `vistas/admin-comunidad.html`: administración de perfiles, roles y estado de cuenta.
- Incorporar un botón **«Citar en la comunidad»** en fichas de estructuras, movimientos, articulaciones, inserciones y casos biomecánicos.

### Servicio de datos recomendado: Supabase

Supabase aporta autenticación, PostgreSQL, API web y políticas de seguridad por fila. Encaja mejor que una base documental porque un comentario puede relacionarse con varios objetos normalizados: autor, tema, estructura anatómica, movimiento, fuente y fragmento citado.

El navegador utilizará únicamente la URL del proyecto y la clave pública/publicable. La clave `service_role` nunca debe incluirse en el repositorio, HTML, bundle ni GitHub Actions público.

## Estado de la vista previa

- La comunidad, las normas y el panel administrativo ya están generados como páginas responsivas.
- Jhostyn y Gerardo aparecen como administradores de demostración con la etiqueta pública **Entusiasta**.
- El panel permite buscar y editar nombre, profesión pública, rol y estado; por ahora conserva los cambios en `localStorage` para probar la experiencia sin credenciales.
- La migración `docs/community-supabase-schema.sql` deja preparada una política RLS que autoriza la edición de otros perfiles únicamente a administradores activos.
- Antes del lanzamiento real faltan crear ambas cuentas en Supabase Auth, sustituir los UUID de ejemplo y conectar las operaciones del panel con una RPC o Edge Function protegida.

Alternativa viable: Firebase Authentication + Firestore. Es adecuada para comentarios y tiempo real, pero las relaciones entre citas, estructuras y movimientos quedarían más desnormalizadas. Para este atlas se recomienda Supabase.

## Experiencia de aprendizaje

### Entrada desde el atlas

1. La persona selecciona una estructura o movimiento.
2. Pulsa **«Citar en la comunidad»**.
3. Se abre un panel previo con:
   - tipo: músculo, hueso, articulación, movimiento, inserción o biomecánica;
   - nombre visible y término común;
   - fragmento seleccionado o resumen de la ficha;
   - URL estable y estado del modelo;
   - vista y lado, cuando sean relevantes.
4. La persona puede:
   - abrir una discusión nueva;
   - responder en un tema existente sobre la misma estructura;
   - guardar la cita para estudiar después.
5. Si no inició sesión, se conserva el borrador localmente y se solicita autenticación. Después del regreso se recupera el borrador.

### Lectura del foro

Cada cita se representa como una tarjeta, no como texto copiado sin contexto:

- `MÚSCULO · Deltoides`
- fragmento citado;
- región y lado;
- enlace **«Abrir en el atlas»**;
- versión del contenido citado;
- aviso si la ficha cambió desde que se publicó el comentario.

Al abrir el enlace, el atlas seleccionará la estructura y enfocará el modelo mediante parámetros estables, por ejemplo:

`vistas/explorar.html?estructura=deltoid&lado=R&pieza=...`

### Navegación comunitaria

- Categorías iniciales: Anatomía, Movimiento, Biomecánica, Entrenamiento, Fisioterapia académica, Errores y mejoras del atlas.
- Filtros por región corporal, tipo de estructura y nivel: principiante, estudiante y entrenador.
- En cada ficha: **preguntas relacionadas**, **discusiones recientes** y **temas sin respuesta**.
- Acción **«Sorpréndeme»** para abrir una discusión de otra región o nivel.

## Perfiles por área de interés y formación

El sistema debe separar dos conceptos:

1. **Rol de seguridad:** determina permisos técnicos (`member`, `moderator`, `admin`).
2. **Perfil académico o profesional:** describe el contexto desde el que participa la persona, pero no concede permisos de moderación ni autoridad automática.

### Perfiles disponibles

- Público general.
- Principiante en anatomía y movimiento.
- Estudiante de fisioterapia.
- Fisioterapeuta.
- Estudiante de medicina.
- Médico/a.
- Estudiante de ciencias del deporte.
- Profesional de ciencias del deporte.
- Entrenador/a personal.
- Docente o investigador/a.
- Otra área relacionada.

Una persona podrá seleccionar un perfil principal y hasta tres intereses secundarios:

- anatomía descriptiva;
- anatomía funcional;
- fisiología;
- biomecánica;
- rehabilitación;
- entrenamiento y rendimiento;
- prevención de lesiones;
- ergonomía;
- análisis de la marcha;
- investigación y docencia.

### Estado de la etiqueta

- **Autodeclarado:** estado predeterminado. Se mostrará como «Área declarada por el usuario».
- **Verificado:** opcional y posterior. Solo se mostrará después de un proceso administrativo definido.
- **No visible:** la persona puede ocultar su área en el perfil público, aunque conservar sus preferencias privadas para recomendaciones.

Nunca se mostrará «profesional verificado» únicamente porque alguien haya elegido una opción durante el registro. Tampoco se solicitarán públicamente números de colegiado, documentos académicos o datos sensibles. Si en el futuro se implementa verificación, los documentos no deben almacenarse junto con el foro y se necesita una política específica de conservación y eliminación.

### Debates orientados por contexto

Al crear un tema se podrá elegir una audiencia, sin impedir la lectura o participación general:

- Para empezar.
- Estudiantes del área de salud.
- Fisioterapia.
- Medicina.
- Ciencias del deporte y entrenamiento.
- Docencia e investigación.
- Debate interdisciplinario.

La audiencia funciona como filtro y expectativa de profundidad, no como barrera profesional. El autor también elegirá el tipo de conversación:

- Pregunta conceptual.
- Interpretación anatómica.
- Análisis biomecánico.
- Aplicación al entrenamiento.
- Caso educativo ficticio.
- Revisión de una fuente.
- Corrección o mejora del atlas.

No se permitirán casos clínicos identificables ni solicitudes de diagnóstico o tratamiento personal. Los temas de rehabilitación deben mantenerse en un plano educativo y general.

### Presentación en cada publicación

Cada comentario mostrará un bloque de autor consistente. El nombre aparecerá en la primera línea y, justo debajo, una sola etiqueta pública: la profesión seleccionada o «Entusiasta».

```text
Andrea
[Fisioterapia · autodeclarado]

Respuesta orientada a: estudiantes del área de salud
```

Valores públicos previstos: `Entusiasta`, `Fisioterapia`, `Medicina`, `Ciencias del deporte`, `Entrenamiento personal`, `Docencia/Investigación` u `Otra profesión relacionada`. El estado «autodeclarado» o «verificado» se integra en la misma etiqueta y no crea una segunda insignia.

La etapa formativa y los intereses podrán usarse de forma privada para ordenar recomendaciones, pero no aparecerán debajo del nombre ni en los comentarios. La persona podrá ocultar incluso la profesión; en ese caso se mostrará «Entusiasta». La audiencia del tema se presenta aparte para no confundir «quién escribe» con «a quién se dirige el debate».

La etiqueta debe usar color discreto y texto explícito; no depender únicamente del color. En móvil permanecerá en una sola línea. Los lectores de pantalla recibirán una frase equivalente, por ejemplo: «Andrea; profesión declarada: fisioterapia».

Marcado previsto:

```html
<header class="community-author">
  <a class="community-author-name" href="perfil.html?id=...">Andrea</a>
  <span class="profile-tag profession" aria-label="Profesión declarada: fisioterapia">
    Fisioterapia · autodeclarado
  </span>
</header>
```

No se mostrará el correo, identificador interno, proveedor de inicio de sesión ni información usada para una posible verificación.

### Descubrimiento y recomendaciones

La portada de comunidad incluirá:

- **Para tu nivel:** temas con la profundidad seleccionada.
- **Desde tu área:** debates relacionados con el perfil principal.
- **Cruzar perspectivas:** el mismo músculo o gesto discutido desde fisioterapia, medicina y ciencias del deporte.
- **Explorar algo distinto:** contenido de otra región o disciplina.
- **Sin respuesta:** preguntas donde la comunidad puede aportar fuentes o explicaciones.

Las recomendaciones no deben crear una burbuja cerrada. Siempre habrá una acción para ver todas las áreas y otra para cambiar temporalmente el enfoque.

## Identificadores y citas estables

Antes de publicar el foro se debe crear un registro de contenido estable:

```text
content_id       deltoid
content_type     structure
content_version  hash o versión del build
title            Deltoides
common_name      Músculo redondeado del hombro
canonical_url    /vistas/explorar.html?estructura=deltoid
```

Una cita almacenará:

- `content_id` y `content_type`;
- `content_version`;
- `quote_snapshot`, limitado a 400 caracteres;
- `canonical_url` validada por la aplicación;
- `mesh_name`, `side`, `movement_id` y `phase` opcionales;
- `created_at`.

No se permitirá que el cliente escriba URLs externas como si fueran citas internas. La referencia debe resolverse contra el manifiesto local de contenido.

## Modelo de datos

### `profiles`

- `id uuid` → referencia a `auth.users`.
- `display_name`.
- `avatar_url` opcional.
- `bio` breve.
- `role`: `member`, `trusted`, `moderator`, `admin`.
- `discipline`: enumeración del perfil principal.
- `discipline_status`: `self_declared`, `verified`, `hidden`.
- `training_stage`: `general`, `beginner`, `student`, `graduate`, `professional`, `educator`.
- `interests text[]`: máximo tres intereses normalizados.
- `show_discipline boolean`.
- `created_at`, `suspended_until`.

No exponer correo electrónico, proveedor de acceso ni datos privados en perfiles públicos.

### `forum_categories`

- `id`, `slug`, `name`, `description`, `sort_order`, `is_locked`.

### `threads`

- `id uuid`, `category_id`, `author_id`.
- `title`, `body`, `status`: `open`, `resolved`, `locked`, `hidden`.
- `audience`: nivel o disciplina a la que se orienta el debate.
- `discussion_type`: pregunta, anatomía, biomecánica, entrenamiento, fuente o mejora.
- `difficulty`: `introductory`, `intermediate`, `advanced`.
- `content_type`, `content_id` opcionales para la referencia principal.
- `created_at`, `updated_at`, `last_activity_at`.

### `posts`

- `id uuid`, `thread_id`, `author_id`, `parent_post_id` opcional.
- `body` en texto o Markdown restringido.
- `status`: `visible`, `edited`, `hidden`, `deleted_by_author`.
- `created_at`, `updated_at`.

### `citations`

- `id`, `post_id`.
- campos de cita estable descritos anteriormente.
- `source_id` opcional para citar además una fuente bibliográfica del atlas.

### `reactions`

- `post_id`, `user_id`, `kind`.
- clave única por publicación, usuario y tipo.

### `reports`

- `id`, `reporter_id`, `post_id`, `reason`, `details`, `status`, `created_at`.

### `moderation_actions`

- registro inmutable de ocultar, restaurar, bloquear, advertir o suspender.
- autor moderador, motivo y fecha.

## Autenticación

Primera fase:

- correo con enlace mágico o contraseña;
- verificación de correo obligatoria para publicar;
- nombre público separado del correo;
- cierre de sesión y eliminación de cuenta accesibles.

Segunda fase opcional:

- acceso con GitHub o Google;
- conservar la misma tabla `profiles` aunque cambie el proveedor.

No se recomienda autenticación telefónica para el MVP por coste, privacidad y complejidad.

## Políticas RLS mínimas

- Lectura pública solamente de temas y publicaciones `visible`.
- Crear tema o respuesta: `auth.uid()` debe coincidir con `author_id`, la cuenta debe estar verificada y no suspendida.
- Editar: solo el autor durante una ventana definida, sin poder cambiar `author_id` ni `thread_id`.
- Eliminación del usuario: cambio a `deleted_by_author`; no borrar físicamente una conversación con respuestas.
- Moderación: únicamente roles `moderator` o `admin`.
- Perfiles: cada usuario modifica solo su propio perfil; los roles no pueden modificarse desde el cliente.
- La persona puede modificar su disciplina autodeclarada, intereses y visibilidad, pero no `discipline_status=verified` ni ningún rol privilegiado.
- Solo una función administrativa protegida puede conceder o retirar una verificación.
- Reportes: el autor puede crear y consultar sus reportes; solo moderadores actualizan el estado.
- Índices para `thread_id`, `last_activity_at`, `content_id`, `author_id` y estados visibles.

Las reglas deben probarse con sesiones anónimas, miembros, autores, usuarios suspendidos y moderadores antes del despliegue.

## Seguridad y moderación

- Escapar HTML; permitir únicamente un subconjunto seguro de Markdown.
- Longitudes máximas para título, comentario, cita y biografía.
- Límite de publicaciones por intervalo y enfriamiento para cuentas nuevas.
- CAPTCHA solo cuando se detecte abuso, no como requisito permanente.
- Botón de reporte con motivos: spam, acoso, información peligrosa, suplantación, contenido fuera de tema.
- Filtros automáticos como ayuda, nunca como única decisión de moderación.
- En contenido clínico, mostrar un aviso: «Discusión académica; no es orientación médica individual».
- Prohibir datos de pacientes, diagnósticos personales identificables y recomendaciones de tratamiento individual.
- Historial de edición visible y registro de moderación.
- Copias de seguridad y procedimiento de restauración probado.

## Privacidad y cumplimiento básico

- Política de privacidad clara antes del registro.
- Recoger solo correo, identificador técnico y perfil público mínimo.
- Consentimiento separado para comunicaciones no esenciales.
- Herramienta para exportar o eliminar la cuenta.
- Al eliminar una cuenta, anonimizar aportes que deban conservarse para no romper conversaciones.
- Definir edad mínima y reglas de participación antes del lanzamiento público.

## Rendimiento

- No cargar el SDK ni comentarios dentro de todas las páginas automáticamente.
- En las fichas, cargar solo un contador y los tres temas más recientes cuando la sección sea visible.
- Paginación por cursor, no descargar todo el foro.
- Suscripción en tiempo real solo dentro de un tema abierto.
- Cachear categorías y manifiesto de contenidos.
- Mantener el visor 3D independiente: un fallo del foro no debe impedir explorar el atlas.

## Fases de implementación

### Fase 0 — Base de citas

- Definir IDs estables para estructuras, movimientos, páginas y fuentes.
- Añadir parámetros `estructura`, `lado`, `pieza`, `movimiento` y `fase` al visor.
- Crear el manifiesto versionado `content-manifest.json`.
- Añadir botón local «Copiar enlace a esta vista».

### Fase 1 — Comunidad en modo lectura

- Crear las cuatro páginas de comunidad.
- Datos de demostración locales sin cuentas reales.
- Validar navegación, accesibilidad, móvil y enlaces de regreso al atlas.

### Fase 2 — Autenticación y publicaciones

- Crear proyecto Supabase y variables públicas de configuración.
- Aplicar migraciones SQL, índices y RLS.
- Implementar registro, acceso, sesión, perfiles, temas y respuestas.
- Añadir selección de disciplina, etapa formativa, intereses y privacidad; todas las etiquetas comienzan como autodeclaradas.
- Conservar borradores durante el acceso.

### Fase 3 — Citas profundas

- Crear discusiones desde cualquier ficha.
- Previsualizar la estructura citada.
- Abrir el visor en la misma estructura, lado, pieza, movimiento y fase.
- Detectar citas de versiones antiguas.

### Fase 4 — Moderación y lanzamiento

- Reportes, bloqueo, historial, límites y roles.
- Normas comunitarias y privacidad.
- Pruebas de abuso, inyección, autorización y accesibilidad.
- Beta cerrada antes de abrir el registro público.

### Fase 5 — Aprendizaje social

- Marcar respuesta útil o tema resuelto.
- Colecciones de discusiones por ruta de aprendizaje.
- Preguntas de la semana asociadas a una estructura.
- Reputación limitada a contribuciones educativas; evitar rankings que premien volumen o consejo clínico.

## Criterios de aceptación del MVP

1. Un visitante puede leer temas visibles sin que el visor deje de funcionar.
2. Una cuenta verificada puede publicar y editar únicamente su propio contenido.
3. Una cita abre la misma estructura del atlas y muestra su nombre, tipo y versión.
4. Ningún cliente puede asignarse rol de moderador ni publicar como otro usuario.
5. Un comentario oculto deja de ser público, pero permanece en el registro de moderación.
6. El foro funciona con teclado, lector de pantalla y móvil.
7. El sistema conserva un borrador si obliga a iniciar sesión.
8. Las pruebas de RLS niegan explícitamente operaciones no autorizadas.
9. La comunidad muestra el aviso académico y las normas antes de la primera publicación.
10. La página sigue desplegándose en GitHub Pages sin incluir secretos.
11. El rol técnico y el perfil académico están separados; cambiar de disciplina nunca concede privilegios.
12. Las publicaciones distinguen claramente perfiles autodeclarados de perfiles verificados.
13. Se puede filtrar por audiencia y disciplina sin impedir explorar otras perspectivas.
14. Debajo del nombre aparece una sola etiqueta: profesión o «Entusiasta», con el estado de verificación integrado y una alternativa textual accesible.

## Pruebas necesarias

- Unitarias: validación, sanitización, creación de citas y generación de enlaces.
- Integración: registro → cita → tema → respuesta → regreso al atlas.
- RLS: matriz de permisos por rol y estado.
- Seguridad: XSS, cambio de autor, manipulación de IDs, spam y URLs falsas.
- Accesibilidad: foco, mensajes de error, diálogos, contraste y navegación táctil.
- Rendimiento: carga inicial sin SDK comunitario, paginación y dispositivo móvil.

## Fuentes técnicas

- GitHub Pages es alojamiento estático: <https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages>
- Supabase Auth: <https://supabase.com/docs/guides/auth/architecture>
- Supabase Row Level Security: <https://supabase.com/features/row-level-security>
- Supabase, gestión segura de perfiles: <https://supabase.com/docs/guides/auth/managing-user-data>
- Firebase Authentication y reglas, como alternativa: <https://firebase.google.com/docs/rules/rules-and-auth>

