# Entregable — Laboratorio extra S09 (DAE)

**React revisado por pruebas: la IA escribe, el verificador decide**

- Estudiante: Farid Chavez
- Repositorio: https://github.com/faridchz16/Lab09-Extra-React

## 1. Configuración de Claude Code

_Descripción de `CLAUDE.md`, `.claude/settings.json` (reglas deny) y los subagentes `test-reviewer` y `react-fixer`._

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

Se escribió cada componente en `src/duel/team/`, se ejecutó `npm run duel` justo después y se
hizo un commit por componente. Todos pasaron en el **primer intento**; la columna «Duel» muestra
el total acumulado después de cada uno.

| Tarea | Componente | Intentos | Pruebas de la tarea | Duel tras el cambio | Evidencia | Commit |
|---|---|---|---|---|---|---|
| T1 | `Header` | 1 | 5/5 ✅ | 5/43 | `03_duel_T1_header` | `7e4335f` |
| T2 | `Footer` | 1 | 6/6 ✅ | 11/43 | `04_duel_T2_footer` | `21d2d97` |
| T3 | `MovieCard` | 1 | 6/6 ✅ | 17/43 | `05_duel_T3_moviecard` | `932fe28` |
| T4 | `Showtimes` | 1 | 6/6 ✅ | 23/43 | `06_duel_T4_showtimes` | `65fb6c5` |
| T5 | `MovieList` | 1 | 5/5 ✅ | 28/43 | `07_duel_T5_movielist` | `0868e71` |
| T6 | `Synopsis` | 1 | 5/5 ✅ | 33/43 | `08_duel_T6_synopsis` | `03c2d59` |
| T7 | `Hero` | 1 | 5/5 ✅ | 38/43 | `09_duel_T7_hero` | `02bbc69` |
| T8 | `AgentMessage` | 1 | 5/5 ✅ | **43/43** | `10_duel_T8_agentmessage_verde` | `35d9d5a` |

Decisiones que hicieron pasar las pruebas a la primera (leídas antes en el verificador):

- **T1 `Header`:** `<header>` (rol `banner`), `<h1>{name}</h1>` y
  `<nav aria-label="Principal">` con `<ul>`/`<li>`/`<a href>`; `key={link.href}`.
- **T2 `Footer`:** `className` (no `class`), `<footer>` (rol `contentinfo`) y los enlaces
  `` `tel:${phone}` `` y `` `mailto:${email}` `` construidos desde el prop.
- **T3 `MovieCard`:** `<article>` e `<img alt={movie.title}>`; sin `alt` la imagen no tiene
  nombre accesible.
- **T4 `Showtimes`:** se compara `times.length === 0` de forma explícita. Con
  `times.length && <ul>` React dibujaría un `0` suelto cuando la lista está vacía.
- **T5 `MovieList`:** `key={movie.id}`, un identificador estable de cada película, no el índice.
- **T6 `Synopsis`** y **T8 `AgentMessage`:** el texto va como `{text}`, que React escapa: las
  etiquetas se ven literalmente y no se ejecutan. Nunca `dangerouslySetInnerHTML`.
- **T7 `Hero`:** el prop se llama `movie`, igual que lo pasa `App.jsx`.

**Resultado final:** `Test Files 8 passed (8)`, `Tests 43 passed (43)`
(`Evidencias_extra/10_duel_T8_agentmessage_verde.txt` y `.png`).

**Cartelera completa:** `Evidencias_extra/11_cartelera_team.png`, tomada con `capture.mjs`. La
sinopsis hostil y el mensaje del agente se ven como texto literal (`<img src=x onerror=…>`), la
película «Ruta 91» muestra «Sin funciones hoy» y la consola del navegador
(`11_cartelera_team.txt`) no tiene errores ni avisos de React; `window.__xss` quedó
`undefined`.

### Paso 7 — Pedir los componentes a una IA (omitido)

Se omite: en este laboratorio los componentes de `src/duel/team/` ya los escribió Claude Code
(una IA) en los pasos 5 y 6, siempre comprobados contra el verificador. La comparación con otra
IA se hace en la Parte 3 con las respuestas fijas de `src/duel/ai/`.

## 4. Parte 3 — El duelo con la IA (`npm run duel:ai`)

| Tarea | Componente | ¿Falla? | Clasificación (ruidoso / avisa / silencioso) | Qué ocurrió |
|---|---|---|---|---|
| T1 | Header | | | |
| T2 | Footer | | | |
| T3 | MovieCard | | | |
| T4 | Showtimes | | | |
| T5 | MovieList | | | |
| T6 | Synopsis | | | |
| T7 | Hero | | | |
| T8 | AgentMessage | | | |

## 5. Parte 4 — Arreglo de la copia de la IA (`npm run duel:fixed`)

_Por cada arreglo: qué hacía el código, por qué React lo trata así y qué hace ahora._

## 6. Parte 5 — Datos de terceros (XSS)

_Paso 13: `dangerouslySetInnerHTML` en `Synopsis`, evidencia de `window.__xss` en la consola y reversión._

## 7. Evidencias

_Capturas en `Evidencias_extra/`._

## 8. Conclusiones
