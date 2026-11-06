# Lab09 Extra: React revisado por pruebas — la IA escribe, el verificador decide

Este repositorio contiene el desarrollo del laboratorio **extra de la semana 9** de Desarrollo de Aplicaciones Empresariales (DAE). Sobre la cartelera de cine del [Lab09-React](https://github.com/faridchz16/Lab09-React) se escriben **ocho componentes pequeños** contra **pruebas automáticas**, se comparan con las respuestas de una IA (que falla seis de las ocho tareas) y se lleva una copia de esas respuestas **de rojo a verde**. El informe completo, paso a paso, está en [`docs/ENTREGABLE.md`](docs/ENTREGABLE.md).

## 🚀 Descripción General del Proyecto

La aplicación es la cartelera del cine ficticio **"Cine Tecsup"** (Vite + React 19). Muestra una cabecera con navegación, una película destacada con su sinopsis, los horarios de hoy, la rejilla de 8 películas, un mensaje de un «agente de IA» y el pie con los datos de contacto. Los datos son fijos (`src/data/movies.js`) e incluyen dos trampas a propósito: una película **sin funciones hoy** («Ruta 91») y una **sinopsis hostil** con `<img src=x onerror="window.__xss=1">`.

El laboratorio gira en torno a cuatro ideas:

1. **Las pruebas son el oráculo:** Vitest + Testing Library en jsdom deciden si un componente está bien. Consultan por **rol y nombre accesible** (`getByRole("banner")`, `getByRole("heading", { level: 1, name })`…), no por clases CSS, y un espía de `console.error` (`watchConsole`) convierte los avisos de React en pruebas en rojo.
2. **Tres orígenes de componentes y un solo verificador:** `team/` (lo nuestro), `ai/` (las respuestas de una IA, de solo lectura) y `fixed/` (la copia arreglada de la IA). Cada modo de Vite elige la carpeta.
3. **Tres clases de fallo:** *ruidoso* (el render lanza una excepción), *avisa* (React imprime un aviso en consola) y *silencioso* (nada se queja; solo la prueba lo detecta).
4. **Datos no confiables:** la sinopsis de un tercero y el texto de un agente de IA se muestran **siempre como texto** (`{text}`), nunca con `dangerouslySetInnerHTML`.

Componentes funcionales con props, sin estado ni hooks (eso es la semana 10):

| Tarea | Componente | Props | Qué devuelve | Autor |
|---|---|---|---|---|
| T1 | `Header` | `name`, `links` | `<header>` con `<h1>` y `<nav aria-label="Principal">` con `<ul>/<li>/<a>` | Alumno (sin IA) |
| T2 | `Footer` | `contact` | `<footer>` con la dirección y enlaces `tel:` y `mailto:` | Alumno (sin IA) |
| T3 | `MovieCard` | `movie` | `<article>` con `<img alt={title}>`, `<h3>` y `★ rating` | Alumno (sin IA) |
| T4 | `Showtimes` | `times` | `<ul>` de horas, o `<p>Sin funciones hoy</p>` si la lista está vacía | Alumno (sin IA) |
| T5 | `MovieList` | `movies` | `<ul>` con un `<li key={movie.id}>` y una `MovieCard` por película | Claude Code |
| T6 | `Synopsis` | `text` | `<p>{text}</p>`: texto literal, nunca HTML | Claude Code |
| T7 | `Hero` | `movie` | `<section aria-label="Destacada">` con `<h2>` y el enlace «Ver horarios» | Claude Code |
| T8 | `AgentMessage` | `author`, `text` | `<p><strong>{author}:</strong> <span>{text}</span></p>` | Claude Code |

## 🔗 Enlaces de Acceso Local (Desarrollo)

Con el servidor de desarrollo (`npm run dev`) en marcha:
- **Cartelera:** http://localhost:5173/ (usa «localhost», no 127.0.0.1)
- **Sección Cartelera:** http://localhost:5173/#cartelera
- **Horarios de la película destacada:** http://localhost:5173/#horarios-1
- **Comprobación de XSS (consola del navegador):** `window.__xss` → debe ser `undefined`

## 📋 Resumen de Implementación y Puesta en Marcha

1. **Verificación del Entorno:**
   ```powershell
   node --version                  # Node 20 o superior; probado con v24.15.0
   npm --version
   ```

2. **Instalación y Servidor de Desarrollo:**
   ```powershell
   npm install
   npm run dev                     # Deja corriendo en una terminal → http://localhost:5173
   ```

3. **El Duelo de Pruebas:**
   ```powershell
   npm run duel                    # src/duel/team/  (lo nuestro)       → 43/43 ✅
   npm run duel:ai                 # src/duel/ai/    (la IA, intacta)   → 14 en rojo ❌
   npm run fixed:init              # copia ai/ a fixed/ (-- --force para empezar de cero)
   npm run duel:fixed              # src/duel/fixed/ (la IA arreglada)  → 43/43 ✅
   ```

4. **Evidencias Automáticas** (Playwright 1.64.1 vía `npx`, sin añadirlo a `package.json`):
   ```powershell
   node scripts/capture.mjs Evidencias_extra/11_cartelera_team.png             # página completa 1440×900 + consola .txt
   node scripts/capture.mjs salida.png --selector=footer                      # solo un elemento
   node scripts/terminal.mjs Evidencias_extra/02_duel_inicial.txt              # .txt de pruebas → .png de terminal
   sh scripts/evidence.sh duel:fixed 26_duel_fixed_final                      # ejecuta y guarda .txt + .png
   ```

**Dependencias:** `react` y `react-dom` 19, `vite` 7 y `@vitejs/plugin-react` 5. Para las pruebas, `vitest` 3.2, `@testing-library/react` 16, `@testing-library/jest-dom` 6 y `jsdom` 26. No se añadió ninguna dependencia.

## 🗂️ Estructura del Proyecto

```
Lab09-Extra-React/
├── CLAUDE.md                  # Reglas del laboratorio para Claude Code
├── .claude/
│   ├── settings.json          # deny: tests/, ai/, movies.js y support.js no se pueden editar
│   └── agents/                # Subagentes test-reviewer y react-fixer
├── docs/
│   └── ENTREGABLE.md          # Informe detallado de cada paso (1–15)
├── Evidencias_extra/          # Capturas y salidas de las pruebas (01–26)
├── scripts/
│   ├── fixed-init.mjs         # (docente) copia src/duel/ai/ → src/duel/fixed/
│   ├── playwright-loader.mjs  # Carga Playwright con npx sin instalarlo en el proyecto
│   ├── capture.mjs            # Captura de http://localhost:5173 + mensajes de consola
│   ├── terminal.mjs           # Convierte una salida .txt en un PNG de terminal oscura
│   └── evidence.sh            # npm run <script> → Evidencias_extra/NN_nombre.txt + .png
└── src/
    ├── App.jsx                # Compone la cartelera con los ocho componentes (@cartelera)
    ├── data/movies.js         # Datos fijos: 8 películas, contacto y enlaces (protegido)
    └── duel/
        ├── tests/             # T1…T8: el verificador (protegido)
        ├── support.js         # Selector de origen, watchConsole, failImages, xssFlag (protegido)
        ├── team/              # T1–T4 del alumno (sin IA) + T5–T8 de Claude Code ✍️
        ├── ai/                # Las 8 respuestas originales de la IA (protegido)
        └── fixed/             # La copia de ai/ arreglada ✍️
```

## 🥊 Resultados del Duelo

| Origen | Comando | Test Files | Tests | Evidencia |
|---|---|---|---|---|
| `team/` (inicio) | `npm run duel` | 8 failed | 43 failed | `02_duel_inicial` |
| `team/` (todo Claude Code) | `npm run duel` | **8 passed** | **43 passed** | `25_duel_final_team` |
| `team/` (T1–T4 reiniciados) | `npm run duel` | 5 failed \| 3 passed | 28 failed \| 15 passed | `27_reinicio_T1_T4_rojo` |
| `team/` (final: T1–T4 del alumno) | `npm run duel` | **8 passed** | **43 passed** | `32_duel_final_alumno_T1_T4` |
| `ai/` | `npm run duel:ai` | 6 failed \| 2 passed | 14 failed \| 29 passed | `12_duel_ai` |
| `fixed/` (inicio) | `npm run duel:fixed` | 6 failed \| 2 passed | 14 failed \| 29 passed | `13_duel_fixed_inicial` |
| `fixed/` (final) | `npm run duel:fixed` | **8 passed** | **43 passed** | `33_duel_fixed_final` |

La guía pedía escribir **T1 a T4 sin IA**. Por eso, aunque Claude Code había escrito los ocho al primer intento, el alumno reinició T1–T4 y los rehízo en VS Code: **28 → 23 → 17 → 6 → 0** pruebas en rojo. T1 necesitó 2 ejecuciones, porque la primera fue sin guardar el archivo; T2, T3 y T4, una. T5 pasó a verde a la vez que T3, porque `MovieList` usa `MovieCard`. T5–T8 siguen siendo los de Claude Code.

> ⚠️ **Verde no significa terminado:** las pruebas pasaron con `MovieCard` y `Showtimes` sin `className="movie-card"` ni `className="showtimes"`, y la cartelera salió sin estilos (evidencia 31). Se corrigió en `cd32eee`. Las pruebas verifican roles y accesibilidad, no la apariencia.

La copia de la IA bajó de 14 a 0 pruebas en rojo en seis arreglos: **14 → 9 → 8 → 7 → 5 → 3 → 0**.

## 🐞 Los 6 Fallos de la IA

| Tarea | Qué hizo la IA | Prueba que lo detecta | Clase | Arreglo |
|---|---|---|---|---|
| T7 `Hero` | `function Hero({ film })` y `film.title`; `App` pasa `movie` | Las 5 pruebas: `TypeError: Cannot read properties of undefined (reading 'title')` | 💥 **ruidoso** | `{ film }` → `{ movie }` |
| T2 `Footer` | `<footer class="footer">` | «no produce avisos de React…»: ``Invalid DOM property `class`. Did you mean `className`?`` | ⚠️ **avisa** | `class` → `className` |
| T3 `MovieCard` | `<img src={movie.image} />` sin `alt` | «la imagen tiene como texto alternativo el título…»: `Unable to find an element with the alt text` | 🤫 **silencioso** | `alt={movie.title}` |
| T4 `Showtimes` | `if (!times)` (un `[]` es *truthy*) y `{times.length && …}` | «con lista vacía muestra «Sin funciones hoy»» y «…no imprime un 0 suelto»: `expected '0' to be 'Sin funciones hoy'` | 🤫 **silencioso** | `if (!times \|\| times.length === 0)` |
| T5 `MovieList` | `<li key={index}>` | «al invertir el orden…» y «al quitar la primera película…»: el `<li>` no es el mismo nodo (`toBe`) | 🤫 **silencioso** | `key={movie.id}` |
| T6 `Synopsis` | `dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, "<br />") }}` | 3 pruebas: texto literal, `img`/`b` creados y `expected 1 to be undefined` (`window.__xss`) | 🤫 **silencioso (XSS)** | `<p>{text}</p>` + `white-space: pre-line` |

**¿Por qué T1 y T8 no fallan?** La IA usó en `Header` la semántica exacta (`<header>`, `<h1>`, `<nav aria-label="Principal">`, `key={link.href}`), y en `AgentMessage` insertó el texto como `{text}`, que React escapa. Es justo lo contrario de lo que hizo la misma IA en `Synopsis`: el riesgo no está en el dato, sino en cómo se inserta.

**XSS en el navegador (paso 13):** con `dangerouslySetInnerHTML` en `Synopsis`, `window.__xss` vale `1`, aparece una imagen rota y el texto en negrita (captura 20). Tras revertir, `window.__xss` es `undefined` y las etiquetas se ven escritas (captura 21). Es el mismo principio que el autoescape de Django: `{{ variable }}` ≈ `{text}` y `{{ variable|safe }}` ≈ `dangerouslySetInnerHTML`.

## 🤖 Agentes Utilizados en Claude Code

Las reglas del proyecto están en `CLAUDE.md`. `.claude/settings.json` **bloquea la edición** de `src/duel/tests/`, `src/duel/ai/`, `src/data/movies.js` y `src/duel/support.js`, para que la IA no pueda aprobar cambiando el examen. Se configuraron dos subagentes en `.claude/agents/`:
- **test-reviewer:** revisor de **solo lectura** (`Read`, `Grep`, `Glob`, `Bash`). Ejecuta `duel`, `duel:ai` o `duel:fixed`, resume por tarea T1–T8 y clasifica cada fallo como ruidoso / avisa / silencioso. Se usó en el estado inicial (43 en rojo, todos ruidosos) y en el duelo con la IA (6 tareas: 1 ruidosa, 1 que avisa y 4 silenciosas).
- **react-fixer:** solo puede editar `src/duel/fixed/`. Arregla **un fallo por ronda** con el cambio mínimo, ejecuta `duel:fixed` y explica qué hacía el código, por qué React lo trata así y qué hace ahora. No hace commits: cada arreglo se confirmó por separado. Propuso dos mejoras opcionales que se rechazaron para que cada cambio fuera mínimo (ver el paso 15 del entregable).

**Reparto del trabajo:** el **alumno** escribió sin IA **T1 a T4** (`Header`, `Footer`, `MovieCard` y `Showtimes`), dirigió los pasos, revisó los resultados y tomó las capturas del navegador y de su terminal (01, 20–23, 27–31, 34 y 35). **Claude Code** escribió **T5 a T8** (`MovieList`, `Synopsis`, `Hero` y `AgentMessage`), todo `src/duel/fixed/`, los scripts de evidencias y la documentación.

## 📦 Estructura de Commits del Repositorio

Historial en commits atómicos documentados en español (un commit por componente y por arreglo):
- *(último)* - Entregable: tareas 1 a 4 rehechas por el alumno
- `cd32eee` - Clases CSS de MovieCard y Showtimes para recuperar los estilos *(alumno)*
- `44e779c` - T4: Showtimes escrito por el alumno *(alumno)*
- `ea32f87` - T3: MovieCard escrito por el alumno *(alumno)*
- `67fe34e` - T2: Footer escrito por el alumno *(alumno)*
- `b72a4f0` - T1: Header escrito por el alumno *(alumno)*
- `b210d81` - Reinicio de T1 a T4 al estado del docente para escribirlos sin IA *(alumno)*
- `0611d0b` - Pasos 13 a 15, README del laboratorio y evidencias finales
- `af92033` - Entregable: pasos 10 a 12 (arreglos de la copia de la IA y keys en T5)
- `4b55605` - Arreglo T6 (fixed): Synopsis como texto, sin dangerouslySetInnerHTML; duel:fixed en verde
- `51dafa2` - Arreglo T5 (fixed): MovieList usa key={movie.id} en vez del índice (quedan 3 en rojo)
- `6a718b4` - Arreglo T4 (fixed): Showtimes trata la lista vacía y ya no dibuja un 0 (quedan 5 en rojo)
- `37c8302` - Arreglo T3 (fixed): MovieCard con alt en la imagen (quedan 7 en rojo)
- `c2660cf` - Arreglo T2 (fixed): Footer usa className en vez de class (quedan 8 en rojo)
- `be2d997` - Arreglo T7 (fixed): Hero recibe el prop movie, no film (quedan 9 en rojo)
- `4fab6c9` - Copia de la IA en src/duel/fixed/ (fixed:init): duel:fixed en rojo, 14 pruebas
- `af66e34` - Duelo con la IA: duel:ai con 6 tareas en rojo y clasificación de los fallos
- `47a8923` - Entregable: pasos 5 a 7 (componentes del equipo en verde)
- `35d9d5a` - T8: componente AgentMessage (mensaje del agente como texto); duel en verde
- `02bbc69` - T7: componente Hero (película destacada con enlace a horarios)
- `03c2d59` - T6: componente Synopsis (sinopsis mostrada como texto, nunca como HTML)
- `0868e71` - T5: componente MovieList (lista de tarjetas con key={movie.id})
- `65fb6c5` - T4: componente Showtimes (lista de horarios o «Sin funciones hoy»)
- `932fe28` - T3: componente MovieCard (tarjeta con imagen, título y valoración)
- `21d2d97` - T2: componente Footer (pie con dirección y enlaces tel: y mailto:)
- `7e4335f` - T1: componente Header (encabezado con navegación principal)
- `e5a4485` - Scripts de evidencias (capturas con Playwright y salida de pruebas como imagen)
- `e6058ce` - Análisis del verificador y estado inicial de las pruebas
- `d895ef1` - Limpieza de reglas de permisos redundantes
- `7745b89` - Configuración de Claude Code: CLAUDE.md, permisos y subagentes
- `861176c` - React revisado por pruebas: la IA escribe, el verificador decide (laboratorio extra de la S09 de DAE)

## 📸 Capturas y Evidencias

Todas las evidencias están en `Evidencias_extra/`. Cada ejecución de pruebas guarda la salida real (`.txt`, con `EXIT=<código>` al final) y su imagen de terminal (`.png`, generada con `scripts/terminal.mjs`). Las capturas 01, 20–23, 27–31, 34 y 35 las tomó el alumno (Chrome y su terminal); la 11, Playwright. Las evidencias 03–06 corresponden a la primera versión de T1–T4, la de Claude Code, que después se sustituyó por la del alumno (27–30).

1. **Estado inicial – página en blanco:**
   `npm run dev` con los componentes sin escribir: `Uncaught Error: TODO(team): write Header in src/duel/team/Header.jsx`.
   ![Error inicial TODO](Evidencias_extra/01_error_inicial_todo.png)

2. **`npm run duel` inicial – todo en rojo:**
   `Test Files 8 failed (8)`, `Tests 43 failed (43)`; todos los fallos son ruidosos (`TODO(team)`). [Salida .txt](Evidencias_extra/02_duel_inicial.txt)
   ![Duel inicial](Evidencias_extra/02_duel_inicial.png)

3. **T1 `Header` – 5/43:** [Salida .txt](Evidencias_extra/03_duel_T1_header.txt)
   ![Duel tras Header](Evidencias_extra/03_duel_T1_header.png)

4. **T2 `Footer` – 11/43:** [Salida .txt](Evidencias_extra/04_duel_T2_footer.txt)
   ![Duel tras Footer](Evidencias_extra/04_duel_T2_footer.png)

5. **T3 `MovieCard` – 17/43:** [Salida .txt](Evidencias_extra/05_duel_T3_moviecard.txt)
   ![Duel tras MovieCard](Evidencias_extra/05_duel_T3_moviecard.png)

6. **T4 `Showtimes` – 23/43:** [Salida .txt](Evidencias_extra/06_duel_T4_showtimes.txt)
   ![Duel tras Showtimes](Evidencias_extra/06_duel_T4_showtimes.png)

7. **T5 `MovieList` – 28/43:** [Salida .txt](Evidencias_extra/07_duel_T5_movielist.txt)
   ![Duel tras MovieList](Evidencias_extra/07_duel_T5_movielist.png)

8. **T6 `Synopsis` – 33/43:** [Salida .txt](Evidencias_extra/08_duel_T6_synopsis.txt)
   ![Duel tras Synopsis](Evidencias_extra/08_duel_T6_synopsis.png)

9. **T7 `Hero` – 38/43:** [Salida .txt](Evidencias_extra/09_duel_T7_hero.txt)
   ![Duel tras Hero](Evidencias_extra/09_duel_T7_hero.png)

10. **T8 `AgentMessage` – 43/43 en verde:** [Salida .txt](Evidencias_extra/10_duel_T8_agentmessage_verde.txt)
    ![Duel en verde](Evidencias_extra/10_duel_T8_agentmessage_verde.png)

11. **Cartelera completa (1440×900, Playwright):**
    Header, Hero, la sinopsis hostil como texto, horarios («Sin funciones hoy» en Ruta 91), las 8 tarjetas, el mensaje del agente como texto y el Footer. La consola no tiene avisos de React y `window.__xss` es `undefined`. [Consola .txt](Evidencias_extra/11_cartelera_team.txt)
    ![Cartelera completa](Evidencias_extra/11_cartelera_team.png)

12. **`npm run duel:ai` – la IA falla 6 de 8 tareas (14 pruebas):** [Salida .txt](Evidencias_extra/12_duel_ai.txt)
    ![Duel IA](Evidencias_extra/12_duel_ai.png)

13. **`npm run duel:fixed` recién copiado – 14 en rojo:** [Salida .txt](Evidencias_extra/13_duel_fixed_inicial.txt)
    ![Duel fixed inicial](Evidencias_extra/13_duel_fixed_inicial.png)

14. **Arreglo T7 `Hero` – quedan 9:** [Salida .txt](Evidencias_extra/14_duel_fixed_T7_hero.txt)
    ![Fixed tras Hero](Evidencias_extra/14_duel_fixed_T7_hero.png)

15. **Arreglo T2 `Footer` – quedan 8:** [Salida .txt](Evidencias_extra/15_duel_fixed_T2_footer.txt)
    ![Fixed tras Footer](Evidencias_extra/15_duel_fixed_T2_footer.png)

16. **Arreglo T3 `MovieCard` – quedan 7:** [Salida .txt](Evidencias_extra/16_duel_fixed_T3_moviecard.txt)
    ![Fixed tras MovieCard](Evidencias_extra/16_duel_fixed_T3_moviecard.png)

17. **Arreglo T4 `Showtimes` – quedan 5:** [Salida .txt](Evidencias_extra/17_duel_fixed_T4_showtimes.txt)
    ![Fixed tras Showtimes](Evidencias_extra/17_duel_fixed_T4_showtimes.png)

18. **Arreglo T5 `MovieList` – quedan 3:** [Salida .txt](Evidencias_extra/18_duel_fixed_T5_movielist.txt)
    ![Fixed tras MovieList](Evidencias_extra/18_duel_fixed_T5_movielist.png)

19. **Arreglo T6 `Synopsis` – 43/43 en verde:** [Salida .txt](Evidencias_extra/19_duel_fixed_T6_synopsis_verde.txt)
    ![Fixed en verde](Evidencias_extra/19_duel_fixed_T6_synopsis_verde.png)

20. **XSS ejecutado (`dangerouslySetInnerHTML`):**
    La sinopsis se interpreta como HTML (imagen rota y «no te lo pierdas» en negrita) y en la consola `window.__xss` devuelve `1`.
    ![XSS ejecutado](Evidencias_extra/20_xss_ejecutado.png)

21. **XSS bloqueado (tras revertir `Synopsis`):**
    La sinopsis se ve como texto con las etiquetas escritas y `window.__xss` devuelve `undefined`.
    ![XSS bloqueado](Evidencias_extra/21_xss_bloqueado.png)

22. **Mensaje del agente como texto:**
    `AgentMessage` muestra `<img src=x onerror=…>` y `<b>…</b>` literales.
    ![Agente como texto](Evidencias_extra/22_agente_como_texto.png)

23. **Mensaje del agente como texto, tras el arreglo:**
    ![Agente como texto tras el arreglo](Evidencias_extra/23_agente_como_texto_tras_arreglo.png)

24. **`npm run duel` con la `Synopsis` insegura – 3 en rojo (T6):** [Salida .txt](Evidencias_extra/24_duel_xss_dangerously.txt)
    ![Duel con dangerouslySetInnerHTML](Evidencias_extra/24_duel_xss_dangerously.png)

25. **Verificación final `npm run duel` – 43/43:** [Salida .txt](Evidencias_extra/25_duel_final_team.txt)
    ![Duel final](Evidencias_extra/25_duel_final_team.png)

26. **Verificación final `npm run duel:fixed` – 43/43:** [Salida .txt](Evidencias_extra/26_duel_fixed_final.txt)
    ![Duel fixed final](Evidencias_extra/26_duel_fixed_final.png)

27. **Reinicio de T1–T4 al estado del docente (alumno):**
    `Test Files 5 failed | 3 passed (8)`, `Tests 28 failed | 15 passed (43)`. T5 también cae porque `MovieList` usa `MovieCard`.
    ![Reinicio T1-T4](Evidencias_extra/27_reinicio_T1_T4_rojo.png)

28. **T1 `Header` escrito por el alumno – 23 failed | 20 passed:**
    Segunda ejecución; la primera falló porque el archivo no estaba guardado.
    ![Header del alumno](Evidencias_extra/28_T1_header_alumno.png)

29. **T3 `MovieCard` escrito por el alumno – 6 failed | 37 passed:**
    T5 `MovieList` pasa a verde a la vez; se ve también el commit `ea32f87`.
    ![MovieCard del alumno](Evidencias_extra/29_T3_moviecard_alumno.png)

30. **T4 `Showtimes` escrito por el alumno – 43/43 en verde:**
    ![Showtimes del alumno, todo en verde](Evidencias_extra/30_T4_showtimes_todo_verde.png)

31. **Pruebas en verde, página sin estilos:**
    Tarjetas sin `className="movie-card"` (pósters a todo el ancho y montados unos sobre otros), el mensaje del agente como texto y `window.__xss` = `undefined`. Se corrigió añadiendo las clases (`cd32eee`).
    ![Tarjetas sin estilos y agente como texto](Evidencias_extra/31_agente_texto_xss_undefined.png)

32. **Verificación final `npm run duel` con T1–T4 del alumno – 43/43:** [Salida .txt](Evidencias_extra/32_duel_final_alumno_T1_T4.txt)
    ![Duel final con T1-T4 del alumno](Evidencias_extra/32_duel_final_alumno_T1_T4.png)

33. **Verificación final `npm run duel:fixed` – 43/43:** [Salida .txt](Evidencias_extra/33_duel_fixed_final.txt)
    ![Duel fixed final](Evidencias_extra/33_duel_fixed_final.png)

34. **`npm test` – todo el proyecto en verde:**
    Las 4 pruebas de los datos (`movies.test.js`) y las 43 del duelo con `team/` pasan: `Test Files 9 passed (9)`, `Tests 47 passed (47)`.
    ![npm test](Evidencias_extra/34_npm_test.png)

35. **`npm run build` – compilación de producción:**
    Vite 7.3.7 transforma 39 módulos y genera `dist/` (`index.html`, CSS y JS) sin errores en 632 ms.
    ![npm run build](Evidencias_extra/35_npm_run_build.png)

---

## 📚 Instrucciones Originales del Docente


Repositorio del laboratorio **extra de la semana 9** de Desarrollo de Aplicaciones Empresariales (DAE).
Complementa el laboratorio oficial de la cartelera de cine (Vite, JSX, componentes, props y listas con `map`):
aquí escribes **ocho componentes pequeños** de esa cartelera contra **pruebas automáticas**, ves cómo una IA
resuelve las mismas ocho tareas (y falla de seis maneras distintas) y llevas una copia de sus respuestas
**de rojo a verde**.

La guía del laboratorio (con su rúbrica) está en el campus virtual; aquí está el código.

> No hay estado ni hooks en este laboratorio: todo son componentes funcionales que reciben props. Eso es la semana 10.

### Puesta en marcha

Necesitas **Node 20 o superior** (`node --version`). En PowerShell, dentro de la carpeta del proyecto:

```powershell
npm install
npm run dev        # abre http://localhost:5173 (usa «localhost», no 127.0.0.1)
```

Al principio la pantalla muestra un error rojo: `TODO(team): write Header ...`. Es lo esperado, porque tus ocho
componentes todavía están sin escribir. Cada vez que escribas uno, el error pasa al siguiente.

### Parte 1 — Leer el verificador

Las pruebas son el oráculo: deciden si un componente está bien. Están en `src/duel/tests/`, una por tarea
(`T1-header.test.jsx` … `T8-agentmessage.test.jsx`). Léelas antes de escribir nada: dicen qué rol, qué nombre
accesible y qué texto se espera, y qué avisos de React no se aceptan. Los datos fijos están en `src/data/movies.js`.

```powershell
npm run duel       # tus componentes (src/duel/team/): al principio todo en rojo
```

### Parte 2 — Escribir los ocho componentes

Escribe cada componente en su archivo de `src/duel/team/` (hoy lanza un error `TODO(team)`). La cabecera de cada
archivo dice qué props recibe y qué debe devolver. Después de cada uno, `npm run duel`; la pantalla
(`npm run dev`) compone los ocho en `src/App.jsx`.

| Tarea | Componente | Props |
|---|---|---|
| 1 | `Header` | `name`, `links` |
| 2 | `Footer` | `contact` |
| 3 | `MovieCard` | `movie` |
| 4 | `Showtimes` | `times` |
| 5 | `MovieList` | `movies` |
| 6 | `Synopsis` | `text` |
| 7 | `Hero` | `movie` |
| 8 | `AgentMessage` | `author`, `text` |

### Parte 3 — El duelo con la IA

```powershell
npm run duel:ai    # las respuestas de una IA (src/duel/ai/): algunas pruebas fallan
```

Lee cada fallo: el nombre de la prueba dice qué se esperaba y el mensaje, qué ocurrió. Clasifica los seis fallos
(el de la tarea 1 y el de la 8 no son fallos: la IA los hizo bien).

### Parte 4 — Arreglar la copia de la IA

```powershell
npm run fixed:init   # copia src/duel/ai/ a src/duel/fixed/ (no pisa lo que ya tengas)
npm run duel:fixed   # rojo
```

Edita **solo** los archivos de `src/duel/fixed/` (nunca los de `ai/`) hasta que `npm run duel:fixed` pase entero, y
explica cada arreglo. Para empezar de cero: `npm run fixed:init -- --force`.

### Parte 5 — Datos de terceros

En `src/data/movies.js` la sinopsis de la primera película es HTML escrito por un tercero, y en `src/App.jsx` hay un
mensaje de un agente de IA con otra etiqueta `<img onerror>`. En esta parte cambias a propósito tu `Synopsis` a
`dangerouslySetInnerHTML`, ves en la consola del navegador (`window.__xss`) que el código se ejecutó, y lo
vuelves a dejar bien. La guía tiene los pasos.

### Qué hace cada script

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite con la cartelera armada con **tus** componentes (`src/duel/team/`) |
| `npm run build` | Compila la aplicación a `dist/` (comprueba que todo importa bien; no ejecuta las pruebas) |
| `npm test` | Todas las pruebas del proyecto: los datos (siempre verdes) y el duelo con **tus** componentes |
| `npm run duel` | El duelo con `src/duel/team/` (lo tuyo) |
| `npm run duel:ai` | El duelo con `src/duel/ai/` (las respuestas de la IA, de solo lectura) |
| `npm run duel:fixed` | El duelo con `src/duel/fixed/` (tu copia arreglada de la IA) |
| `npm run fixed:init` | Crea `src/duel/fixed/` copiando `ai/` |
| `npm run duel:solutions` | Solo docente: el duelo con las soluciones. Sin `teacher/` avisa de que no está disponible |

Las pruebas se ejecutan en jsdom (un navegador simulado) con Vitest y Testing Library. Cada modo (`team`, `ai`,
`fixed`, `solutions`) es un *modo de Vite*: lo elige el archivo `.env.<modo>`, que define `VITE_DUEL_SOURCE`.

### Estructura

| Ruta | Para qué |
|---|---|
| `src/duel/team/` | **Tuyo (Partes 1 y 2):** los ocho componentes sin escribir |
| `src/duel/ai/` | Las ocho respuestas de la IA. No las edites |
| `src/duel/fixed/` | **Tuyo (Parte 4):** la copia de `ai/` que arreglas (la crea `fixed:init`) |
| `src/duel/tests/` | Las pruebas, una por tarea: el verificador |
| `src/duel/support.js` | Elige el origen de los componentes y espía los avisos de la consola |
| `src/data/movies.js` | Los datos fijos: ocho películas, una sin funciones y una con sinopsis hostil |
| `src/App.jsx` | La cartelera armada con los componentes |
| `vite.config.js`, `.env.*` | Modos de Vite y configuración de Vitest |

### Convenciones del curso

Código, nombres y comentarios en inglés; explicaciones y entregables en español.
