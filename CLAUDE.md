# CLAUDE.md

## Laboratorio

Laboratorio **extra de la semana 9** de Desarrollo de Aplicaciones Empresariales (DAE):
**"React revisado por pruebas: la IA escribe, el verificador decide"**.

Se escriben ocho componentes pequeños de una cartelera de cine (Vite + React 19) contra pruebas
automáticas (Vitest + Testing Library en jsdom), se compara con las respuestas de una IA (que falla
seis de las ocho tareas) y se lleva una copia de esas respuestas de rojo a verde.

| Tarea | Componente | Props |
|---|---|---|
| T1 | `Header` | `name`, `links` |
| T2 | `Footer` | `contact` |
| T3 | `MovieCard` | `movie` |
| T4 | `Showtimes` | `times` |
| T5 | `MovieList` | `movies` |
| T6 | `Synopsis` | `text` |
| T7 | `Hero` | `movie` |
| T8 | `AgentMessage` | `author`, `text` |

Las pruebas (`src/duel/tests/T1…T8`) son el oráculo: deciden si un componente está bien.

## Comandos

```powershell
npm run dev          # servidor de Vite (http://localhost:5173) con los componentes de src/duel/team/
npm run duel         # pruebas contra src/duel/team/ (lo nuestro)
npm run duel:ai      # pruebas contra src/duel/ai/ (respuestas de la IA, solo lectura)
npm run fixed:init   # copia src/duel/ai/ a src/duel/fixed/ (añadir -- --force para empezar de cero)
npm run duel:fixed   # pruebas contra src/duel/fixed/ (copia arreglada de la IA)
```

## Reglas

- **NUNCA editar** estas rutas protegidas (también bloqueadas en `.claude/settings.json`):
  - `src/duel/tests/` (el verificador)
  - `src/duel/ai/` (las respuestas originales de la IA)
  - `src/data/movies.js` (los datos fijos)
  - `src/duel/support.js` (selector de origen y espía de consola)
- **Solo se editan** `src/duel/team/` y `src/duel/fixed/`.
- Componentes **funcionales con props**, sin estado ni hooks (eso es la semana 10).
- **Nunca** usar `dangerouslySetInnerHTML`. Única excepción: el paso 13 de la guía (Parte 5),
  donde se usa a propósito en `Synopsis` para ver el XSS (`window.__xss`) y **se revierte después**.
- Código, nombres y comentarios en **inglés**; explicaciones y entregables en **español**.
- **Un commit por tarea**, con el mensaje en español.

## Subagentes

- `test-reviewer`: ejecuta `duel`, `duel:ai` o `duel:fixed`, resume por tarea (T1–T8) y clasifica
  cada fallo como ruidoso / avisa / silencioso. Solo lectura.
- `react-fixer`: arregla los fallos de `src/duel/fixed/` de uno en uno y explica cada arreglo.

## Entregables

- `docs/ENTREGABLE.md`: informe del laboratorio.
- `Evidencias_extra/`: capturas de pantalla y salidas de las pruebas.
