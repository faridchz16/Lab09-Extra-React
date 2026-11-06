# Entregable — Laboratorio extra S09 (DAE)

**React revisado por pruebas: la IA escribe, el verificador decide**

- Estudiante: Farid Chavez
- Repositorio: https://github.com/faridchz16/Lab09-Extra-React

## 1. Configuración de Claude Code

- **`CLAUDE.md`:** describe el laboratorio, las 8 tareas con sus props, los comandos (`duel`,
  `duel:ai`, `fixed:init`, `duel:fixed`) y las reglas: solo se editan `src/duel/team/` y
  `src/duel/fixed/`; componentes funcionales con props, sin estado ni hooks; nunca
  `dangerouslySetInnerHTML` (salvo el paso 13, que se revierte); código en inglés y
  explicaciones en español; un commit por tarea.
- **`.claude/settings.json`:** cuatro reglas `deny` que impiden a Claude Code editar las rutas
  protegidas: `src/duel/tests/**` (el verificador), `src/duel/ai/**` (las respuestas originales
  de la IA), `src/data/movies.js` y `src/duel/support.js`. Así la IA no puede «aprobar»
  cambiando el examen.
- **Subagentes (`.claude/agents/`):**
  - `test-reviewer`: herramientas `Read, Grep, Glob, Bash`, sin `Edit` ni `Write`. Ejecuta
    `duel`, `duel:ai` o `duel:fixed`, resume por tarea y clasifica cada fallo como ruidoso /
    avisa / silencioso. Se usó en los pasos 4 y 8.
  - `react-fixer`: puede editar, pero su prompt lo limita a `src/duel/fixed/`, a un fallo por
    vez y a no hacer commits. Se usó en el paso 11.

  Separar quien revisa (solo lectura) de quien arregla es la misma idea que el verificador:
  quien escribe el código no decide si está bien.

## 2. Parte 1 — Lectura del verificador

### Paso 1 — Arranque del proyecto

Se ejecutó `npm install` y `npm run dev`; la página quedó en blanco y la consola mostró
`Uncaught Error: TODO(team): write Header in src/duel/team/Header.jsx`
(captura `01_error_inicial_todo.png`).

### Paso 2 — Los datos fijos (`src/data/movies.js`)

- **Cuántas películas hay:** 8 (ids 1 a 8).
- **Cuál no tiene funciones hoy:** la película 5, **«Ruta 91»**, con `showtimes: []`
  (es el caso de lista vacía que deben manejar `Showtimes` y `MovieCard`).
- **Sinopsis hostil** (película 1, «La Última Función»), copiada tal cual:

  ```text
  Gran estreno <img src=x onerror="window.__xss=1"> <b>no te lo pierdas</b>
  ```

- **Qué parte ejecutaría código si se insertara como HTML:** la etiqueta
  `<img src=x onerror="window.__xss=1">`. El navegador intenta cargar la imagen `x`, falla y
  dispara el manejador `onerror`, que ejecuta el JavaScript `window.__xss=1`. Aquí solo pone una
  bandera, pero un atacante podría leer cookies, cambiar la página o enviar datos a otro servidor.
  El `<b>…</b>` solo cambiaría el formato (negrita), no ejecuta nada. Si React muestra el texto
  como `{text}`, todo se escapa y se ve literalmente, sin ejecutarse.

### Paso 3 — Lectura de las pruebas T1 y T2 (sin escribir código)

Todas las pruebas obtienen el componente con `loadSource()` (que elige `team`, `ai` o `fixed`
según el modo) y, antes de cada prueba, activan `watchConsole()`.

**T1 — `Header` (`src/duel/tests/T1-header.test.jsx`)**

| # | Prueba | Consulta usada | Qué comprueba |
|---|---|---|---|
| 1 | no produce avisos de React en la consola | `watchConsole()` → `warnings()` | Que React no imprimió ningún `console.error` al renderizar (lista vacía `[]`). |
| 2 | es el encabezado de la página (rol banner) | `getByRole("banner")` | Que existe un `<header>` de página (rol `banner`). |
| 3 | el nombre del cine es un encabezado de nivel 1 | `getByRole("heading", { level: 1, name: "Cine Tecsup" })` | Que el nombre es un `<h1>` cuyo nombre accesible es exactamente el prop `name`. |
| 4 | la navegación se llama «Principal» y lista un enlace por opción | `getByRole("navigation", { name: "Principal" })`, `within(nav).getByRole("list")`, `getAllByRole("listitem")`, `within(item).getByRole("link", { name })` | Que hay un `<nav aria-label="Principal">` con una lista `<ul>`, tantos `<li>` como enlaces, y en cada `<li>` un `<a>` con el texto `label` y `href` correcto (`toHaveAttribute("href", …)`), en orden. |
| 5 | con otros datos muestra esos datos y no los del ejemplo | `getByRole("heading", { level: 1, name: "Cine Norte" })`, `within(nav).getAllByRole("link")` | Que el componente usa sus props y no tiene datos fijos: con `name="Cine Norte"` y enlaces Alfa/Beta muestra exactamente esos. |

**T2 — `Footer` (`src/duel/tests/T2-footer.test.jsx`)**

| # | Prueba | Consulta usada | Qué comprueba |
|---|---|---|---|
| 1 | no produce avisos de React en la consola (usa className, no class) | `watchConsole()` → `warnings()` | Que no hay avisos como `Invalid DOM property 'class'` (hay que usar `className`). |
| 2 | es el pie de la página (rol contentinfo) | `getByRole("contentinfo")` | Que existe un `<footer>` de página (rol `contentinfo`). |
| 3 | muestra la dirección | `getByText(contact.address)` | Que el texto exacto de la dirección aparece en un elemento. |
| 4 | el teléfono es un enlace tel: | `getByRole("link", { name: contact.phone })` | Que el teléfono es un `<a>` con `href="tel:+51987654321"`. |
| 5 | el correo es un enlace mailto: | `getByRole("link", { name: contact.email })` | Que el correo es un `<a>` con `href="mailto:hola@cinetecsup.example"`. |
| 6 | con otros datos de contacto muestra esos datos | `getByText("Calle Uno 123")`, `getByRole("link", { name })` | Que con otro objeto `contact` muestra esa dirección y genera los `tel:`/`mailto:` a partir de los props. |

**¿Por qué consultar por rol y nombre accesible y no por una clase de CSS?**

- **Prueba lo que el usuario percibe**, no cómo está escrito el código. Un lector de pantalla
  anuncia «encabezado de nivel 1, Cine Tecsup» o «navegación Principal»; si la prueba pasa, la
  página es accesible. Una clase `.title` no garantiza nada: un `<div class="title">` pasaría
  aunque no sea un encabezado.
- **Obliga a usar HTML semántico** (`<header>`, `<nav>`, `<h1>`, `<ul>/<li>`, `<a href>`,
  `<footer>`) y etiquetas accesibles (`aria-label="Principal"`).
- **Es robusta frente a cambios de estilo:** renombrar clases o cambiar de CSS a otro sistema no
  rompe la prueba; cambiar la semántica sí, que es lo que importa.
- **Detecta errores reales:** `getByRole` falla si hay cero o varios elementos que coinciden, y el
  nombre accesible debe coincidir exactamente con el texto esperado.

**¿Para qué sirve el espía `watchConsole`?**

`watchConsole()` (en `src/duel/support.js`) reemplaza `console.error` con un espía de Vitest
(`vi.spyOn(console, "error").mockImplementation(() => {})`) que guarda cada llamada sin
imprimirla, y devuelve una función que lista la primera línea de cada mensaje. En modo desarrollo
React no lanza excepción por errores como usar `class` en vez de `className`, olvidar la `key` en
una lista o pasar un atributo inválido: **solo imprime un aviso en la consola y la página sigue
funcionando**. Sin el espía esos fallos serían «silenciosos» para las pruebas; con él, la primera
prueba de cada archivo exige `warnings()` igual a `[]`. Va primero a propósito porque React
imprime cada tipo de aviso una sola vez por archivo. En `afterEach`, `vi.restoreAllMocks()`
devuelve `console.error` a la normalidad.

### Paso 4 — Estado inicial de las pruebas (`npm run duel`)

Antes de escribir ningún componente se usó el subagente `test-reviewer` para ejecutar
`npm run duel`. La salida completa está en `Evidencias_extra/02_duel_inicial.txt` (sin los
códigos de color ANSI). El comando terminó con código de salida 1.

**Resumen: todas en rojo.**

```text
 Test Files  8 failed (8)
      Tests  43 failed (43)
```

| Tarea | Componente | Pruebas | Resultado | Clasificación |
|---|---|---|---|---|
| T1 | `Header` | 5 | 0/5 ❌ | ruidoso |
| T2 | `Footer` | 6 | 0/6 ❌ | ruidoso |
| T3 | `MovieCard` | 6 | 0/6 ❌ | ruidoso |
| T4 | `Showtimes` | 6 | 0/6 ❌ | ruidoso |
| T5 | `MovieList` | 5 | 0/5 ❌ | ruidoso |
| T6 | `Synopsis` | 5 | 0/5 ❌ | ruidoso |
| T7 | `Hero` | 5 | 0/5 ❌ | ruidoso |
| T8 | `AgentMessage` | 5 | 0/5 ❌ | ruidoso |
| **Total** | | **43** | **0 pasan, 43 fallan** | |

**Mensaje de una de las pruebas** (T1, el mismo en sus 5 pruebas):

```text
 FAIL  src/duel/tests/T1-header.test.jsx > [team] T1 Header > el nombre del cine es un encabezado de nivel 1
Error: TODO(team): write Header in src/duel/team/Header.jsx
 ❯ Header src/duel/team/Header.jsx:6:9
      5| export default function Header({ name, links }) {
      6|   throw new Error("TODO(team): write Header in src/duel/team/Header.js…
       |         ^
```

En T7 la primera prueba sale distinta, porque comprueba de forma explícita que el render no
lanza nada:

```text
AssertionError: expected [Function] to not throw an error but 'Error: TODO(team): write Hero in src/…' was thrown
```

**Interpretación:** los 43 fallos son **ruidosos**. Cada componente de `src/duel/team/` todavía
lanza `throw new Error("TODO(team): …")`, así que el render se cae con una excepción y no llega a
evaluarse nada más. Este es el punto de partida esperado: el verificador está en rojo y cada
componente que escribamos tiene que pasarlo a verde.

## 3. Parte 2 — Mis ocho componentes (`npm run duel`)

### Herramientas de evidencias

Antes de empezar se prepararon tres scripts (Playwright 1.64.1 vía `npx`, sin añadirlo a
`package.json`):

- `scripts/capture.mjs <salida.png> [--selector=CSS] [--viewport]`: captura
  `http://localhost:5173` a 1440×900 (página completa o un selector) y guarda los mensajes de la
  consola del navegador en un `.txt` con el mismo nombre (al final anota el valor de
  `window.__xss`).
- `scripts/terminal.mjs <salida.txt>`: convierte una salida de pruebas en un PNG con aspecto de
  terminal oscura. No cambia el texto, solo lo colorea por líneas (verde ✓, rojo ×/FAIL).
- `scripts/evidence.sh <script> <nombre>`: ejecuta `npm run <script>` sin colores, guarda la
  salida real en `Evidencias_extra/<nombre>.txt` (con el código de salida al final) y genera
  su `.png`.

Con `terminal.mjs` se creó `02_duel_inicial.png` a partir de `02_duel_inicial.txt`.

### Pasos 5 y 6 — Escribir los componentes de uno en uno

> **Autoría de los componentes de `src/duel/team/`:**
> - **T1 a T4** (`Header`, `Footer`, `MovieCard`, `Showtimes`) los escribió **el alumno**, sin
>   IA, en VS Code.
> - **T5 a T8** (`MovieList`, `Synopsis`, `Hero`, `AgentMessage`) los escribió **Claude Code**.
>
> La guía pedía escribir T1 a T4 sin IA. Al principio Claude Code había escrito los ocho, así que
> el alumno reinició T1 a T4 y los rehízo él mismo (ver «Rehechura de T1 a T4»).

#### Primera pasada: Claude Code escribe los ocho (histórico)

Se escribió cada componente en `src/duel/team/`, se ejecutó `npm run duel` justo después y se
hizo un commit por componente. Los ocho pasaron al **primer intento**. Los resultados de **T5 a
T8 siguen vigentes**. Las versiones de T1 a T4 de esta pasada **se sustituyeron** después por las
del alumno; se dejan sus filas como registro.

| Tarea | Componente | Intentos | Pruebas de la tarea | Duel tras el cambio | Evidencia | Commit | Estado |
|---|---|---|---|---|---|---|---|
| T1 | `Header` | 1 | 5/5 ✅ | 5/43 | `03_duel_T1_header` | `7e4335f` | Sustituido por el del alumno |
| T2 | `Footer` | 1 | 6/6 ✅ | 11/43 | `04_duel_T2_footer` | `21d2d97` | Sustituido por el del alumno |
| T3 | `MovieCard` | 1 | 6/6 ✅ | 17/43 | `05_duel_T3_moviecard` | `932fe28` | Sustituido por el del alumno |
| T4 | `Showtimes` | 1 | 6/6 ✅ | 23/43 | `06_duel_T4_showtimes` | `65fb6c5` | Sustituido por el del alumno |
| T5 | `MovieList` | 1 | 5/5 ✅ | 28/43 | `07_duel_T5_movielist` | `0868e71` | **Vigente** (Claude Code) |
| T6 | `Synopsis` | 1 | 5/5 ✅ | 33/43 | `08_duel_T6_synopsis` | `03c2d59` | **Vigente** (Claude Code) |
| T7 | `Hero` | 1 | 5/5 ✅ | 38/43 | `09_duel_T7_hero` | `02bbc69` | **Vigente** (Claude Code) |
| T8 | `AgentMessage` | 1 | 5/5 ✅ | **43/43** | `10_duel_T8_agentmessage_verde` | `35d9d5a` | **Vigente** (Claude Code) |

Decisiones de Claude Code en T5 a T8:

- **T5 `MovieList`:** `key={movie.id}`, un identificador estable de cada película, no el índice.
- **T6 `Synopsis`** y **T8 `AgentMessage`:** el texto va como `{text}`, que React escapa: las
  etiquetas se ven literalmente y no se ejecutan. Nunca `dangerouslySetInnerHTML`.
- **T7 `Hero`:** el prop se llama `movie`, igual que lo pasa `App.jsx`.

#### Rehechura de T1 a T4 por el alumno (sin IA)

**1. Reinicio.** El alumno devolvió `Header.jsx`, `Footer.jsx`, `MovieCard.jsx` y
`Showtimes.jsx` al estado del docente (`throw new Error("TODO(team): …")`), en el commit
`b210d81` «Reinicio de T1 a T4 al estado del docente para escribirlos sin IA».
`npm run duel` dio **`Test Files 5 failed | 3 passed (8)`, `Tests 28 failed | 15 passed (43)`**
(`27_reinicio_T1_T4_rojo.png`). Fallaron las 22 pruebas de T1–T4 y además **las 5 de T5**:
`MovieList` (de Claude Code) importa `MovieCard`, y al lanzar esta su `TODO(team)`, la lista
entera revienta. Solo T6, T7 y T8 (15 pruebas) siguieron en verde.

**2. Escritura de los cuatro componentes en VS Code, de uno en uno, con `npm run duel` y un
commit por componente:**

| Tarea | Componente | Ejecuciones de `duel` | Resultado de `duel` | Evidencia | Commit |
|---|---|---|---|---|---|
| — | (reinicio) | 1 | 28 failed \| 15 passed | `27_reinicio_T1_T4_rojo.png` | `b210d81` |
| T1 | `Header` | **2**: la 1.ª falló porque el archivo **no estaba guardado** (Vitest leyó la versión del disco, que todavía lanzaba `TODO(team)`); la 2.ª, ya guardado, pasó | 23 failed \| 20 passed | `28_T1_header_alumno.png` | `b72a4f0` |
| T2 | `Footer` | 1 | 17 failed \| 26 passed | — | `67fe34e` |
| T3 | `MovieCard` | 1 | 6 failed \| 37 passed (**T5 pasó a verde a la vez**, porque ya tenía su `MovieCard`) | `29_T3_moviecard_alumno.png` | `ea32f87` |
| T4 | `Showtimes` | 1 | **43 passed (43)** | `30_T4_showtimes_todo_verde.png` | `44e779c` |
| — | Clases CSS (ver abajo) | — | 43 passed | `31_agente_texto_xss_undefined.png` | `cd32eee` |

**3. Explicación del código actual de cada componente del alumno:**

- **T1 `Header`** (`src/duel/team/Header.jsx`):
  ```jsx
  <header>
    <h1>{name}</h1>
    <nav aria-label="Principal">
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  </header>
  ```
  - `<header>` da el rol `banner`; `<h1>{name}</h1>` es el encabezado de nivel 1 con el nombre
    que llega por props, sin texto fijo, así que con «Cine Norte» también funciona.
  - `<nav aria-label="Principal">` hace que la navegación tenga el nombre accesible que busca
    `getByRole("navigation", { name: "Principal" })`.
  - `links.map(...)` crea un `<li>` con un `<a href>` por enlace, en el mismo orden. La
    `key={link.href}` es estable y única (cada enlace apunta a un sitio distinto), así que
    React no avisa.
  - No necesita `className`: `index.css` da estilo con selectores de elemento
    (`header`, `header h1`, `header nav ul`).

- **T2 `Footer`** (`src/duel/team/Footer.jsx`):
  ```jsx
  <footer>
    <p>{contact.address}</p>
    <p><a href={`tel:${contact.phone}`}>{contact.phone}</a></p>
    <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
  </footer>
  ```
  - `<footer>` da el rol `contentinfo`; la dirección va en un `<p>` como texto exacto, para
    `getByText(contact.address)`.
  - Los `href` se construyen con *template literals* a partir del prop: `tel:` + teléfono y
    `mailto:` + correo. El texto del enlace (su nombre accesible) es el propio teléfono o
    correo.
  - No lleva atributo de clase, así que no puede caer en el error de la IA (`class` en vez de
    `className`). Tampoco lo necesita: el CSS usa el selector `footer`.

- **T3 `MovieCard`** (`src/duel/team/MovieCard.jsx`):
  ```jsx
  <article className="movie-card">
    <img src={movie.image} alt={movie.title} />
    <h3>{movie.title}</h3>
    <p>★ {movie.rating}</p>
  </article>
  ```
  - `<article>` da el rol `article`, que también comprueba T5 («cada elemento contiene una
    tarjeta»).
  - `alt={movie.title}` da a la imagen su nombre accesible. Es justo lo que le faltaba a la IA.
  - `<h3>` con el título y `★ {movie.rating}`: React junta `"★ "` y `4.5` en el mismo `<p>`, y
    `getByText("★ 4.5")` lo encuentra.
  - `className="movie-card"` se añadió después (punto 4).

- **T4 `Showtimes`** (`src/duel/team/Showtimes.jsx`):
  ```jsx
  if (times.length === 0) {
    return <p>Sin funciones hoy</p>;
  }
  return (
    <ul className="showtimes">
      {times.map((time) => <li key={time}>{time}</li>)}
    </ul>
  );
  ```
  - Comprueba la lista vacía **de forma explícita** con `times.length === 0` y devuelve solo el
    mensaje. Así no hay `<ul>` vacío ni el «0» suelto que dibujaba la IA con
    `times.length && …`.
  - Con horas, un `<li>` por hora en orden, con `key={time}` (las horas de una película no se
    repiten).
  - `className="showtimes"` se añadió después (punto 4).

Los cuatro archivos conservan el comentario de cabecera del docente (`// TODO(team) · Task N`
con el contrato de props). No afecta al funcionamiento, pero la etiqueta `TODO` ya no
corresponde.

**4. Las pruebas pasaron sin las clases CSS (evidencia 31).** Las primeras versiones del alumno de
`MovieCard` (`<article>`) y `Showtimes` (`<ul>`) **no tenían `className`**, y aun así
`npm run duel` dio 43/43. Al abrir la cartelera en el navegador, las tarjetas y los horarios
salieron **sin estilos**: los pósters a todo el ancho y montados unos sobre otros, sin el fondo
blanco ni la sombra de la tarjeta, y los horarios como una lista con viñetas en lugar de
«píldoras». La causa es que `index.css` les da estilo con `.movie-card` y `.showtimes`. Se
corrigió en el commit `cd32eee` «Clases CSS de MovieCard y Showtimes para recuperar los
estilos» (`<article className="movie-card">` y `<ul className="showtimes">`).
`31_agente_texto_xss_undefined.png` muestra la página durante esa revisión: las tarjetas sin
estilo, el mensaje del agente como texto y `window.__xss` = `undefined`.

**Lección:** las pruebas verifican **roles, nombres accesibles, texto y comportamiento**, no la
apariencia. Que estén en verde no garantiza que la página se vea bien: hay que mirarla. Es la
otra cara de consultar por rol en lugar de por clase. La prueba no se rompe al cambiar estilos,
pero tampoco detecta que se perdieron.

**Resultado final de `team/`** (T1–T4 del alumno y T5–T8 de Claude Code), verificado al cerrar
el laboratorio: `Test Files 8 passed (8)`, `Tests 43 passed (43)`
(`32_duel_final_alumno_T1_T4.txt` / `.png`).

**Cartelera completa:** `Evidencias_extra/11_cartelera_team.png`, tomada con `capture.mjs`
durante la primera pasada, con los ocho componentes de Claude Code. La
sinopsis hostil y el mensaje del agente se ven como texto literal (`<img src=x onerror=…>`), la
película «Ruta 91» muestra «Sin funciones hoy» y la consola del navegador
(`11_cartelera_team.txt`) no tiene errores ni avisos de React; `window.__xss` quedó
`undefined`.

### Paso 7 — Pedir los componentes a una IA (omitido)

Se omite: en este laboratorio los componentes T5 a T8 de `src/duel/team/` ya los escribió
Claude Code (una IA) en los pasos 5 y 6, siempre comprobados contra el verificador. T1 a T4 los
escribió el alumno sin IA. La comparación con otra IA se hace en la Parte 3 con las respuestas
fijas de `src/duel/ai/`.

## 4. Parte 3 — El duelo con la IA (`npm run duel:ai`)

### Pasos 8 y 9 — Las respuestas de la IA contra el verificador

Se usó el subagente `test-reviewer` para ejecutar `npm run duel:ai` y clasificar cada fallo.
La salida real está en `Evidencias_extra/12_duel_ai.txt` / `.png`.

```text
 Test Files  6 failed | 2 passed (8)
      Tests  14 failed | 29 passed (43)
```

| Tarea | Componente | ¿Falla? | Clasificación | Qué ocurrió |
|---|---|---|---|---|
| T1 | Header | No (5/5) | — | Correcto. |
| T2 | Footer | Sí (5/6) | **avisa** | `class` en vez de `className`. |
| T3 | MovieCard | Sí (5/6) | **silencioso** | `<img>` sin `alt`. |
| T4 | Showtimes | Sí (4/6) | **silencioso** | `!times` nunca es cierto con `[]` y `times.length && …` dibuja un `0`. |
| T5 | MovieList | Sí (3/5) | **silencioso** | `key={index}`. |
| T6 | Synopsis | Sí (2/5) | **silencioso** | `dangerouslySetInnerHTML`: XSS. |
| T7 | Hero | Sí (0/5) | **ruidoso** | El prop se llama `film`, pero se pasa `movie`. |
| T8 | AgentMessage | No (5/5) | — | Correcto. |

Resumen: 6 de 8 tareas fallan, con **1 ruidosa** (T7), **1 que avisa** (T2) y **4 silenciosas**
(T3, T4, T5, T6).

**Detalle de los 6 fallos**

| Tarea | Qué hizo la IA | Prueba que falla | Mensaje | Clase |
|---|---|---|---|---|
| T2 `Footer` | `<footer class="footer">` (`ai/Footer.jsx:3`) | «no produce avisos de React en la consola (usa className, no class)» | `AssertionError: expected [ Array(1) ] to deeply equal []`; el aviso capturado es ``Invalid DOM property `class`. Did you mean `className`?`` | **avisa**: se dibuja bien, pero React imprime un aviso en `console.error` y `watchConsole` lo atrapa. |
| T3 `MovieCard` | `<img src={movie.image} />` sin `alt` (`ai/MovieCard.jsx:4`) | «la imagen tiene como texto alternativo el título de la película» | `TestingLibraryElementError: Unable to find an element with the alt text: La Última Función` | **silencioso**: React no avisa de un `alt` que falta; solo la consulta por texto alternativo lo detecta. |
| T4 `Showtimes` | `if (!times)` (un `[]` es *truthy*) y `{times.length && <ul>…}` (`ai/Showtimes.jsx:2,8`) | «con lista vacía muestra el mensaje «Sin funciones hoy»» y «con lista vacía no imprime un 0 suelto» | `Unable to find an element with the text: Sin funciones hoy` y `AssertionError: expected '0' to be 'Sin funciones hoy'` (el DOM es `<div class="showtimes">0</div>`) | **silencioso**: `0 && x` vale `0` y React dibuja los números; no hay error ni aviso. |
| T5 `MovieList` | `movies.map((movie, index) => <li key={index}>…)` (`ai/MovieList.jsx:6-7`) | «al invertir el orden, cada película conserva su propio nodo del DOM» y «al quitar la primera película, las demás conservan su nodo del DOM» | `AssertionError: expected <li><article …(1)>…(3)</article></li> to be <li>… // Object.is equality`; el `<li>` de «Medianoche en Lima» ahora contiene «La Última Función» | **silencioso**: hay `key`, así que React no avisa; el error solo aparece al reordenar. |
| T6 `Synopsis` | `dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, "<br />") }}` (`ai/Synopsis.jsx:2-3`) | «…se muestra como texto literal…», «…no crea elementos nuevos (ni img ni b)», «…no ejecuta código: window.__xss queda sin definir» | `expected 'Gran estreno  no te lo pierdas' to be 'Gran estreno <img src=x onerror="wind…'`, `expected <img src="x" …(1)></img> to have a length of +0 but got 2` y `AssertionError: expected 1 to be undefined` | **silencioso**: es una API válida, no avisa y con texto normal funciona; con datos hostiles inyecta el `<img>` y su `onerror` se ejecuta (`window.__xss = 1`). |
| T7 `Hero` | `function Hero({ film })` … `<h2>{film.title}</h2>` (`ai/Hero.jsx:1,4`) | Las 5 pruebas | `TypeError: Cannot read properties of undefined (reading 'title')`; la primera falla como `expected [Function] to not throw an error but 'TypeError: …' was thrown` | **ruidoso**: `film` es `undefined`, el render lanza una excepción y la página entera se cae. |

**¿Por qué T1 y T8 no fallan?**

- **T1 `Header`:** la IA usó exactamente la semántica que pide el verificador. `<header>` da el
  rol `banner`, `<h1>{name}</h1>` el encabezado de nivel 1, y hay
  `<nav aria-label="Principal">` con `<ul>`, un `<li>` por enlace y
  `<a href={link.href}>{link.label}</a>`. Cada `<li>` lleva una key estable
  (`key={link.href}`, no el índice), no usa `class` y todo sale de los props, así que con «Cine
  Norte» o «Alfa/Beta» también funciona. Además, la lista de enlaces nunca se reordena en las
  pruebas.
- **T8 `AgentMessage`:** usa `className`, `<strong>{author}:</strong>` y
  `<span>{text}</span>` dentro de un solo `<p>`. El texto del agente entra como hijo JSX
  (`{text}`), que React escapa, así que el mensaje hostil se ve literal, no crea `img`/`b` y
  `window.__xss` queda `undefined`. Es justo lo contrario de lo que hizo la misma IA en T6: el
  riesgo no depende del dato, sino de cómo se inserta.

**Lección:** solo 1 de los 6 fallos es ruidoso (se ve al abrir la página). Los otros 5 pasarían
una revisión «a ojo»: la página se ve bien y la consola, salvo T2, está limpia. Por eso hace
falta un verificador automático.

## 5. Parte 4 — Arreglo de la copia de la IA (`npm run duel:fixed`)

### Paso 10 — Copia de la IA en rojo

`npm run fixed:init` copió `src/duel/ai/` a `src/duel/fixed/` (las originales no se tocan).
`npm run duel:fixed` dio el mismo rojo que la IA (`13_duel_fixed_inicial.txt` / `.png`):

```text
 Test Files  6 failed | 2 passed (8)
      Tests  14 failed | 29 passed (43)
```

### Paso 11 — El subagente `react-fixer` arregla un fallo cada vez

Se le pidió al subagente `react-fixer` **un único fallo por ronda**: cambio mínimo y
`npm run duel:fixed`. Después de cada ronda se volvió a ejecutar `duel:fixed` para guardar la
evidencia y se hizo un commit. Se empezó por el ruidoso (T7) y se terminó por el de seguridad
(T6).

| # | Tarea | Cambio | Pruebas en rojo después | Evidencia | Commit |
|---|---|---|---|---|---|
| — | (inicio) | — | **14** | `13_duel_fixed_inicial` | `4fab6c9` |
| 1 | T7 `Hero` | `{ film }` → `{ movie }` | **9** | `14_duel_fixed_T7_hero` | `be2d997` |
| 2 | T2 `Footer` | `class` → `className` | **8** | `15_duel_fixed_T2_footer` | `c2660cf` |
| 3 | T3 `MovieCard` | `<img>` + `alt={movie.title}` | **7** | `16_duel_fixed_T3_moviecard` | `37c8302` |
| 4 | T4 `Showtimes` | `if (!times)` → `if (!times \|\| times.length === 0)` | **5** | `17_duel_fixed_T4_showtimes` | `6a718b4` |
| 5 | T5 `MovieList` | `key={index}` → `key={movie.id}` | **3** | `18_duel_fixed_T5_movielist` | `51dafa2` |
| 6 | T6 `Synopsis` | `dangerouslySetInnerHTML` → `{text}` | **0** ✅ | `19_duel_fixed_T6_synopsis_verde` | `4b55605` |

**Arreglo 1 — T7 `Hero` (ruidoso)**

```diff
-export default function Hero({ film }) {
+export default function Hero({ movie }) {
-      <h2>{film.title}</h2>
-      <a href={`#horarios-${film.id}`}>Ver horarios</a>
+      <h2>{movie.title}</h2>
+      <a href={`#horarios-${movie.id}`}>Ver horarios</a>
```

- **Qué hacía el código:** desestructuraba un prop `film`, pero `App` y las pruebas pasan
  `movie`. `film` valía `undefined` y `film.title` lanzaba
  `TypeError: Cannot read properties of undefined (reading 'title')`.
- **Por qué React lo trata así:** React mete todos los atributos JSX en un objeto `props` y no
  comprueba sus nombres. Un nombre equivocado no da aviso: el valor es simplemente `undefined`.
  El error es de JavaScript y salta durante el render, así que React desmonta el árbol y la
  página entera queda en blanco. Por eso es **ruidoso** y caen las 5 pruebas.
- **Qué hace ahora:** recibe `movie`, como dice el contrato, y dibuja la región «Destacada», el
  `<h2>` y el enlace a `#horarios-<id>`.

**Arreglo 2 — T2 `Footer` (avisa)**

```diff
-    <footer class="footer">
+    <footer className="footer">
```

- **Qué hacía el código:** usaba el atributo HTML `class`. La página se veía bien.
- **Por qué React lo trata así:** en JSX los atributos siguen los nombres de las propiedades DOM
  de JavaScript (`className`, porque `class` es palabra reservada). React no lanza error: en
  desarrollo imprime ``Invalid DOM property `class`. Did you mean `className`?`` en
  `console.error`. Es un fallo que **avisa**, y solo lo detecta la prueba que lee la consola con
  `watchConsole`.
- **Qué hace ahora:** usa `className`. El DOM resultante es el mismo y la consola queda limpia.

**Arreglo 3 — T3 `MovieCard` (silencioso)**

```diff
-      <img src={movie.image} />
+      <img src={movie.image} alt={movie.title} />
```

- **Qué hacía el código:** el póster no tenía `alt`, así que la imagen no tenía nombre
  accesible.
- **Por qué React lo trata así:** a React no le importa que falte `alt`: no hay error ni aviso.
  Es un fallo de accesibilidad (un lector de pantalla no sabe qué película es) que solo detecta
  `getByAltText` / `getByRole("img", { name })`. Por eso es **silencioso**.
- **Qué hace ahora:** `alt={movie.title}`, y la prueba encuentra las 8 imágenes por su título.

**Arreglo 4 — T4 `Showtimes` (silencioso)**

```diff
-  if (!times) {
+  if (!times || times.length === 0) {
     return <p>Sin funciones hoy</p>;
```

- **Qué hacía el código:** `!times` solo atrapa `null`/`undefined`, y un array vacío `[]` es
  *truthy*. Después, `{times.length && <ul>…}` con longitud 0 devolvía `0`, y la página
  mostraba un «0» suelto en lugar de «Sin funciones hoy».
- **Por qué React lo trata así:** React no dibuja `false`, `null`, `undefined` ni `true`, pero
  **sí dibuja los números**, incluido `0`. No hay error ni aviso: es **silencioso**.
- **Qué hace ahora:** trata la lista vacía de forma explícita y devuelve el mensaje.
  `react-fixer` señaló que `{times.length && …}` sigue en el archivo. Ya es inofensivo (solo se
  llega ahí con `length >= 1`), pero es un patrón frágil. Lo correcto es `times.length > 0 && …`,
  como en `team/`. Se dejó así para que el cambio fuera mínimo.

**Arreglo 5 — T5 `MovieList` (silencioso)**

```diff
-      {movies.map((movie, index) => (
-        <li key={index}>
+      {movies.map((movie) => (
+        <li key={movie.id}>
```

- **Qué hacía el código:** la `key` era la posición en el array, no la película.
- **Por qué React lo trata así:** con una `key`, aunque sea el índice, React no avisa. Al
  reordenar, React empareja los elementos por `key`: el `<li key={0}>` sigue existiendo, así que
  lo reutiliza y solo le cambia el contenido por el de otra película. Es **silencioso** (ver el
  paso 12).
- **Qué hace ahora:** `key={movie.id}`, estable y única. Al reordenar o quitar, React **mueve**
  los nodos existentes y solo elimina el de la película que desaparece.

**Arreglo 6 — T6 `Synopsis` (silencioso, XSS)**

```diff
-  const html = text.replace(/\n/g, "<br />");
-  return <p className="synopsis" dangerouslySetInnerHTML={{ __html: html }} />;
+  // Rendered as a text child: React escapes it. Line breaks come from CSS (white-space: pre-line).
+  return <p className="synopsis">{text}</p>;
```

- **Qué hacía el código:** para convertir los `\n` en `<br />` metía **todo el texto** como
  HTML. Las etiquetas de la sinopsis hostil se convertían en elementos reales y el `onerror` del
  `<img>` ejecutaba `window.__xss = 1`.
- **Por qué React lo trata así:** un hijo `{text}` siempre se escapa y se inserta como nodo de
  texto. `dangerouslySetInnerHTML` es la salida explícita que desactiva esa protección. React
  confía en quien la usa, así que no avisa: es **silencioso**, y con texto normal funciona
  perfectamente.
- **Qué hace ahora:** el texto va como hijo, las etiquetas se ven literalmente y no se crea ni
  se ejecuta nada. **Saltos de línea:** ya no se convierten en `<br />`. Se encarga el CSS:
  `src/index.css:17` tiene `.synopsis, .agent-message { white-space: pre-line; }`, que muestra
  los `\n` como saltos de línea. El formato lo da el CSS y el dato sigue siendo texto.

**Resultado final** (`19_duel_fixed_T6_synopsis_verde.txt` / `.png`):

```text
 Test Files  8 passed (8)
      Tests  43 passed (43)
```

### Paso 12 — Las dos pruebas de T5 que reordenan con `rerender`

```jsx
const { rerender } = render(<MovieList movies={movies} />);
const before = movies.map(itemOf);                       // the <li> of each movie
rerender(<MovieList movies={[...movies].reverse()} />);  // or movies.slice(1)
movies.forEach((movie, i) => expect(itemOf(movie)).toBe(before[i]));
```

**Qué comprueban: la identidad de los nodos.** `itemOf(movie)` busca el `<li>` que contiene el
`<h3>` de esa película. Antes de `rerender` se guardan las referencias a los 8 `<li>` reales del
DOM. Después de invertir la lista (o de quitar la primera película) se exige con `toBe`
(igualdad `Object.is`, es decir, **el mismo objeto**, no uno parecido) que cada película siga
dentro de **su mismo nodo**. Es lo que debe pasar cuando React reconcilia por `key`: con
`key={movie.id}`, React ve que la key 8 ahora va primero y **mueve** ese `<li>`, sin crear otro
ni reescribir su contenido.

**Por qué `key={index}` no avisa.** El aviso de React es «Each child in a list should have a
unique "key" prop», y solo salta si **falta** la key o si hay keys **repetidas**. Los índices
0…7 están presentes y son únicos, así que React queda satisfecho: no sabe que el índice no
identifica a la película. Además, el primer render es idéntico y se ve bien. Por eso pasan la
prueba de avisos y la de orden, y solo fallan las de `rerender`. Con `key={index}`, al invertir,
el `<li key={0}>` que tenía «La Última Función» se queda en su sitio y React solo le cambia el
texto, la imagen y la valoración por los de «Medianoche en Lima». Es justo el diff que mostró
`duel:ai`.

**Cómo se rompería con campos que rellena el usuario.** Hoy `MovieCard` no tiene estado, así
que el error es invisible: reescribir el contenido da el mismo aspecto. Pero el DOM (y el
estado de React, desde la semana 10) va pegado al nodo, no a la película. Si cada tarjeta
tuviera un `<input>` no controlado (por ejemplo, «número de entradas» o un comentario) o un
`useState`, y el usuario escribiera «3 entradas» en «La Última Función» antes de invertir el
orden, el `<input>` con ese valor seguiría en el `<li key={0}>`. Tras el `rerender` ese `<li>`
muestra «Medianoche en Lima», así que **las 3 entradas aparecerían en otra película**. Al quitar
la primera película pasa lo mismo: desaparece el último nodo (key 7) y cada valor escrito se
corre una película hacia arriba. Lo mismo ocurre con el foco, la selección de texto, las
animaciones o un `<video>` en reproducción. Con `key={movie.id}` cada valor se queda con su
película.

## 6. Parte 5 — Datos de terceros (XSS)

### Paso 13 — Romper `Synopsis` a propósito (y revertir)

**Qué se cambió.** En `src/duel/team/Synopsis.jsx`, **sin commit**, se sustituyó la versión
segura por la insegura:

```diff
-  return <p className="synopsis">{text}</p>;
+  // TEMPORARY (guide step 13): unsafe on purpose to show the XSS. Revert after the screenshots.
+  return <p className="synopsis" dangerouslySetInnerHTML={{ __html: text }} />;
```

**Lo que se vio en el navegador** (capturas del alumno, Chrome DevTools):

- `20_xss_ejecutado.png`: la sinopsis se interpreta como HTML. Aparece «Gran estreno», el
  icono de **imagen rota** (el `<img src=x>`) y «**no te lo pierdas**» en negrita (el `<b>`).
  En la consola, `window.__xss` devuelve **`1`**: el `onerror` se ejecutó.
- `21_xss_bloqueado.png`: tras revertir, la sinopsis se ve como texto plano con las etiquetas
  escritas (`Gran estreno <img src=x onerror="window.__xss=1"> <b>no te lo pierdas</b>`) y
  `window.__xss` devuelve **`undefined`**.

**Las 3 pruebas que fallaron con `dangerouslySetInnerHTML`** (`npm run duel`: `Tests 3 failed |
40 passed (43)`; salida en `24_duel_xss_dangerously.txt` / `.png`):

| Prueba de T6 | Mensaje |
|---|---|
| la sinopsis hostil se muestra como texto literal, con sus etiquetas a la vista | `AssertionError: expected 'Gran estreno  no te lo pierdas' to be 'Gran estreno <img src=x onerror="wind…'` |
| la sinopsis hostil no crea elementos nuevos en la página (ni img ni b) | `AssertionError: expected <img src="x" …(1)></img>` … `to have a length of +0 but got 2` |
| la sinopsis hostil no ejecuta código: window.__xss queda sin definir | `AssertionError: expected 1 to be undefined` |

Las otras dos pruebas de T6 («no produce avisos» y «un texto normal se muestra tal cual»)
**siguieron en verde**: React no avisa y con datos inocentes el cambio es invisible. Es un fallo
silencioso de manual.

**Reversión.** Se restauró el archivo con `git checkout -- src/duel/team/Synopsis.jsx` (vuelve
a ser exactamente la versión del commit `03c2d59`), y `git status` no mostró cambios en el
código. La verificación final dio `npm run duel` 43/43 (`25_duel_final_team`) y
`npm run duel:fixed` 43/43 (`26_duel_fixed_final`).

### Paso 14 — El texto de un agente de IA es un dato no confiable

**Capturas:** `22_agente_como_texto.png` y `23_agente_como_texto_tras_arreglo.png`. En la
sección «Asistente de la cartelera», `AgentMessage` muestra el mensaje del agente **como
texto**: `Agente: Encontré 8 películas. <img src=x onerror="window.__xss=1"> Sugerencia:
<b>borrar la cartelera</b>.` Se ven `<img …>` y `<b>` literales; no hay imagen rota ni
negrita.

**¿Por qué el texto de un agente es un dato no confiable?**

- **El agente no es el autor real de lo que dice.** Un modelo resume páginas, correos, PDF o
  respuestas de APIs que escribieron terceros. Si alguno de esos textos contiene HTML o
  instrucciones (*prompt injection*), el agente puede copiarlo tal cual en su respuesta. Es lo
  que simula `App.jsx`: un mensaje con un `<img onerror>` y una «sugerencia» de borrar la
  cartelera.
- **No hay garantías sobre su salida.** Puede alucinar, mezclar formato o devolver justo lo que
  un atacante sembró. Que «lo haya escrito nuestra IA» no lo convierte en código nuestro.
- **Debe tratarse igual que cualquier entrada de usuario o de terceros**, como la sinopsis de
  `movies.js`. La regla no depende de quién escribe el texto, sino de **cómo se inserta**: como
  texto siempre; como HTML, nunca sin sanear.

**Qué hace React por defecto con `{text}`.** Todo valor que se pone como hijo en JSX se trata
como **texto, no como marcado**. En el navegador React crea un nodo de texto, así que el
`<` no abre ninguna etiqueta. Al generar HTML (en el servidor) **escapa** los caracteres
especiales: `<` → `&lt;`, `>` → `&gt;`, `&` → `&amp;`, `"` → `&quot;` (y `'`). Por eso
`<img src=x onerror=…>` se ve escrito en pantalla, no crea ningún `<img>` y su `onerror` nunca
existe. La única forma de saltarse esa protección es pedirlo explícitamente con
`dangerouslySetInnerHTML`, un nombre largo y alarmante a propósito.

**Comparación con el autoescape de Django (semana 6).**

| | Django (plantillas) | React (JSX) |
|---|---|---|
| Por defecto | `{{ variable }}` escapa `< > & " '` | `{text}` se inserta como texto (escapado) |
| Desactivar a propósito | filtro `{{ variable\|safe }}`, `{% autoescape off %}` o `mark_safe()` en Python | `dangerouslySetInnerHTML={{ __html: text }}` |
| Cuándo es aceptable | solo con HTML de confianza o saneado (por ejemplo, con *bleach*) | igual: solo con HTML saneado (por ejemplo, con DOMPurify) |
| Lo que vimos | — | en T6 la IA usó el equivalente a `\|safe` con datos de un tercero → XSS |

La idea es la misma en los dos frameworks: **seguro por defecto y peligroso solo si lo pides**.
`{{ sinopsis }}` en Django y `{sinopsis}` en React son equivalentes, igual que
`{{ sinopsis|safe }}` y `dangerouslySetInnerHTML`. El error de la IA en T6 en Django habría
sido escribir `|safe` «para que se vean los saltos de línea». La solución correcta en ambos es
la misma: dejar el escape activo y resolver el formato de otro modo (en Django `|linebreaks`,
que escapa primero; aquí `white-space: pre-line` en CSS).

## 7. Paso 15 — Uso de IA en este laboratorio

**Claude Code** (con los subagentes `test-reviewer` y `react-fixer`) produjo, a partir de las
instrucciones del alumno:
- los componentes **T5 a T8** de `src/duel/team/`;
- todo `src/duel/fixed/`;
- los scripts de `scripts/`;
- la redacción de este entregable y del README.

**El alumno** escribió sin IA los componentes **T1 a T4** de `src/duel/team/`, decidió los pasos,
revisó los resultados y **tomó las capturas del navegador y de su terminal** (`01`, `20`–`23` y
`27`–`31`). El oráculo fueron siempre las pruebas, que la IA no podía editar (reglas `deny`).

| # | Qué se le pidió a Claude Code | Qué respondió / hizo | Aceptado o rechazado, y por qué |
|---|---|---|---|
| 1 | Pasos 2–4: analizar los datos y las pruebas T1/T2 sin escribir código, y ejecutar `duel` con `test-reviewer` | Respuestas del paso 2, tablas de T1/T2, explicación de roles y `watchConsole`, 43 pruebas en rojo (todas ruidosas) | **Aceptado.** Se comprobó contra `movies.js`, los archivos de prueba y la salida real. |
| 2 | Scripts de evidencias con Playwright vía `npx` (`capture.mjs`, `terminal.mjs`) | Los creó con un cargador que relanza el script con `npx -p playwright@1.64.1`, más `evidence.sh` para guardar `.txt` + `.png` | **Aceptado con dos correcciones de la propia IA:** descartó Playwright 1.65.0 por estar publicado ese mismo día (prefirió una versión con semanas de uso) y, al ver colores ANSI en la salida, añadió `NO_COLOR=1`. Las salidas de Testing Library conservan algunos códigos de color en los `.txt`; el `.png` los oculta. |
| 3 | Pasos 5–6: escribir los 8 componentes de `team/` de uno en uno, con un commit por componente | Los 8 pasaron **al primer intento** (43/43) | **T5–T8 aceptados.** Lo decidió el verificador, no la confianza en la IA; se comprobó también en el navegador (`11_cartelera_team.png`, consola sin avisos). **T1–T4 rechazados después** (fila 3b). |
| 3b | — (decisión del alumno, sin IA) | El alumno reinició T1–T4 al estado del docente (`b210d81`: 28 failed \| 15 passed) y los escribió él mismo en VS Code: T1 en 2 ejecuciones (la 1.ª sin guardar el archivo), T2, T3 y T4 al primer intento, hasta 43/43 | **Versiones de Claude Code de T1–T4 rechazadas** porque **la guía pedía escribir T1 a T4 sin IA**. Las del alumno son las vigentes (`b72a4f0`, `67fe34e`, `ea32f87`, `44e779c`), y la IA no las tocó. |
| 3c | — (decisión del alumno) | Al ver la cartelera sin estilos, el alumno añadió `className="movie-card"` y `className="showtimes"` (`cd32eee`) | **Corrección propia.** Las pruebas estaban en verde sin las clases porque verifican roles y accesibilidad, no la apariencia (evidencia 31). |
| 4 | Paso 7: pedir los componentes a otra IA | No se hizo | **Omitido**, porque `team/` ya lo escribió Claude Code; la comparación con otra IA la da `src/duel/ai/`. |
| 5 | Pasos 8–9: `duel:ai` con `test-reviewer` | 14 fallos en 6 tareas: 1 ruidoso, 1 avisa, 4 silenciosos | **Aceptado.** Las cifras y los mensajes coinciden con la ejecución propia (`12_duel_ai.txt`). |
| 6 | Paso 11: `react-fixer` arregla los 6 fallos de `fixed/`, uno por ronda | Seis arreglos mínimos con su explicación (14 → 9 → 8 → 7 → 5 → 3 → 0) | **Aceptados los seis.** Se volvió a ejecutar `duel:fixed` después de cada uno. |
| 7 | (Sugerencia del propio `react-fixer`) cambiar también `{times.length && …}` en `fixed/Showtimes.jsx` | Lo propuso como mejora opcional | **Rechazado** para que cada arreglo fuera mínimo y trazable a una prueba; queda documentado como patrón frágil. |
| 8 | (Sugerencia de `react-fixer`) partir el texto por `\n` e intercalar `<br />` en `Synopsis` | Lo propuso como alternativa a `white-space: pre-line` | **Rechazado:** el CSS ya existía (`index.css:17`) y no hace falta más código. |
| 9 | Paso 13: cambiar `Synopsis` a `dangerouslySetInnerHTML` sin commit y detenerse | Hizo el cambio, ejecutó `duel` (3 fallos en T6) y se detuvo | **Aceptado.** El alumno tomó las capturas `20` y `21`, y la IA revirtió con `git checkout`. |
| 10 | Numerar las evidencias | Su salida del paso 13 chocaba con la captura `20` del alumno | **Corregido:** se renombró a `24_duel_xss_dangerously`. |
| 11 | Pasos 13–15, README y verificación final | Esta redacción, el README y la ejecución final de `duel` y `duel:fixed` (43/43 y 43/43) | Revisión del alumno pendiente antes de la entrega. |
| 12 | Actualizar el entregable y el README con la rehechura de T1–T4: leer el código del alumno y explicarlo, añadir las evidencias 27–31 y volver a verificar | Explicación de los cuatro componentes, autoría separada en los pasos 5–6, esta tabla y verificación final (`32_duel_final_alumno_T1_T4` y `33_duel_fixed_final`: 43/43 y 43/43) | La IA solo leyó y documentó el código del alumno, sin modificarlo. |

**Límites de lo que hizo la IA.** Claude Code no vio la consola de Chrome del alumno: la única
consola que vio fue la de Playwright (`11_cartelera_team.txt`). Las afirmaciones sobre
`window.__xss` en el navegador real se apoyan en las capturas del alumno.

## 8. Evidencias

Todas están en `Evidencias_extra/`. Cada salida de pruebas tiene un `.txt` (la salida real, con
`EXIT=<código>` al final) y un `.png` generado con `scripts/terminal.mjs`.

| Nº | Archivo | Qué muestra | Autor |
|---|---|---|---|
| 01 | `01_error_inicial_todo.png` | Página en blanco y `TODO(team): write Header` en la consola | Alumno |
| 02 | `02_duel_inicial` | `duel` inicial: 43 en rojo | `test-reviewer` |
| 03–10 | `03_duel_T1_header` … `10_duel_T8_agentmessage_verde` | `duel` tras cada componente (5 → 43 en verde) | Claude Code |
| 11 | `11_cartelera_team.png` / `.txt` | Cartelera completa a 1440×900 y su consola | `capture.mjs` |
| 12 | `12_duel_ai` | `duel:ai`: 14 en rojo en 6 tareas | Claude Code |
| 13 | `13_duel_fixed_inicial` | `duel:fixed` recién copiado: 14 en rojo | Claude Code |
| 14–19 | `14_duel_fixed_T7_hero` … `19_duel_fixed_T6_synopsis_verde` | `duel:fixed` tras cada arreglo (9, 8, 7, 5, 3, 0 en rojo) | Claude Code |
| 20 | `20_xss_ejecutado.png` | `dangerouslySetInnerHTML`: imagen rota, negrita y `window.__xss` = `1` | Alumno |
| 21 | `21_xss_bloqueado.png` | Tras revertir: texto literal y `window.__xss` = `undefined` | Alumno |
| 22 | `22_agente_como_texto.png` | El mensaje del agente como texto | Alumno |
| 23 | `23_agente_como_texto_tras_arreglo.png` | El mensaje del agente como texto, tras el arreglo | Alumno |
| 24 | `24_duel_xss_dangerously` | `duel` con la `Synopsis` insegura: 3 en rojo (T6) | Claude Code |
| 25 | `25_duel_final_team` | `duel` final: 43/43 | Claude Code |
| 26 | `26_duel_fixed_final` | `duel:fixed` final: 43/43 (antes de rehacer T1–T4) | Claude Code |
| 27 | `27_reinicio_T1_T4_rojo.png` | `duel` tras reiniciar T1–T4: 28 failed \| 15 passed (T5 también cae) | Alumno |
| 28 | `28_T1_header_alumno.png` | `duel` tras el `Header` del alumno: 23 failed \| 20 passed | Alumno |
| 29 | `29_T3_moviecard_alumno.png` | `duel` tras el `MovieCard` del alumno: 6 failed \| 37 passed (T5 en verde) y su commit | Alumno |
| 30 | `30_T4_showtimes_todo_verde.png` | `duel` tras el `Showtimes` del alumno: 43 passed y su commit | Alumno |
| 31 | `31_agente_texto_xss_undefined.png` | Tarjetas sin las clases CSS (sin estilos), mensaje del agente como texto y `window.__xss` = `undefined` | Alumno |
| 32 | `32_duel_final_alumno_T1_T4` | `duel` final con T1–T4 del alumno: 43/43 | Claude Code |
| 33 | `33_duel_fixed_final` | `duel:fixed` final: 43/43 | Claude Code |

## 9. Conclusiones

1. **El verificador decide, no la apariencia.** De los 6 fallos de la IA, solo 1 (T7) rompía la
   página; 1 dejaba un aviso en consola (T2) y **4 eran silenciosos**: la cartelera se veía
   bien y aun así tenía un XSS, una lista con identidades cruzadas, un «0» suelto y una imagen
   sin texto alternativo. Una revisión «a ojo» habría aprobado 5 de los 6.
2. **Consultar por rol y nombre accesible prueba lo que importa.** Las pruebas obligan a usar
   HTML semántico y accesible, y no se rompen por cambiar estilos.
3. **Los avisos de React son fallos.** `watchConsole` convierte `class` en vez de `className` (o
   una `key` que falta) en una prueba en rojo, en lugar de una línea ignorada en la consola.
4. **`key` estable, no el índice.** `key={index}` no avisa y funciona hasta que la lista cambia.
   Con estado o campos rellenados por el usuario (semana 10), los datos acabarían en la
   película equivocada.
5. **Los datos de terceros, y el texto de un agente de IA, son no confiables.** React escapa
   `{text}` por defecto, como Django con `{{ variable }}`. `dangerouslySetInnerHTML` es el
   `|safe` de React y no debe usarse con datos ajenos. Las capturas 20 y 21 muestran la
   diferencia: `window.__xss` = `1` frente a `undefined`.
6. **La IA es útil si se la verifica y se la acota.** Claude Code escribió T5–T8 y arregló
   `fixed/` rápido y bien, pero porque trabajó contra pruebas que no podía tocar (reglas
   `deny`), con un revisor de solo lectura y un arreglo por commit. La otra IA, sin verificador,
   falló 6 de 8 tareas. T1–T4 se rehicieron sin IA porque así lo pedía la guía: el mismo
   verificador sirve para comprobar el código de una persona y el de una IA.
7. **Verde no significa terminado.** Las pruebas pasaron con `MovieCard` y `Showtimes` sin sus
   clases CSS, y la página se veía rota. Las pruebas cubren la semántica, la accesibilidad y el
   comportamiento; la apariencia hay que revisarla en el navegador (evidencia 31).
