---
name: html-ads
description: >
  Crea HTMLs animados listos para grabar como video y publicar en Instagram Reels,
  LinkedIn, Facebook y X/Twitter. Activar SIEMPRE que el usuario pida: crear un HTML
  de publicidad, anuncio, post animado, creatividad para redes, "haceme un ad de X",
  "quiero publicidad para Instagram", "generá un video para LinkedIn", o cualquier
  contenido visual con objetivo de venta o conversión.
---

# HTML Ads — Creador de Publicidades Animadas (Claude Code)

## Qué es esto

Publicidades animadas para redes sociales. El objetivo es que el espectador haga algo: comprar, seguir, visitar, contactar.

El HTML va a ser grabado por SocialPublisher y convertido a MP4 (1080×1920, H.264).

---

## Diferencia con html-contenido

| | html-ads | html-contenido |
|---|---|---|
| Objetivo | Que haga algo (comprar, seguir) | Que aprenda, guarde o comparta |
| Tono | Persuasivo, urgente | Útil, cercano, experto |
| CTA | Directo a la acción | Invitar a interactuar |

---

## Sistema de Contextos

### Estructura de carpetas

```
context_ptojects/
├── ControlAudit/
│   ├── info.md        ← qué hace la app, público, beneficios
│   ├── colores.md     ← paleta y fuentes de marca
│   ├── capturas/      ← screenshots, logos
│   └── ejemplos_ads/  ← trabajos anteriores (referencia de estilo)
├── ControlDoc/
└── [OtroProyecto]/
```

### Si el usuario NO dice qué app
Listar subcarpetas con `ls` / `dir`, mostrar la lista y preguntar cuál.

### Si el usuario SÍ dice el nombre
Ir directo a leer el contexto sin preguntar.

### Cómo leer el contexto
1. `Read` en cada `.md` y `.txt` de la carpeta del producto
2. `LS` en `capturas/` para ver qué imágenes hay
3. Revisar `ejemplos_ads/` para entender el estilo visual anterior

Con eso, entender: qué hace el producto, para quién, qué problemas resuelve, colores y estilo de marca, qué se comunicó antes.

### Preguntas después de leer el contexto

Solo las que falten:
1. **¿Sobre qué funcionalidad/tema querés el ad?** → sugerir opciones basadas en lo leído
2. **¿Para qué plataforma?** → Instagram / LinkedIn / Facebook / X
3. **¿Cuántos segundos?** → Default: 15s Instagram, 20s LinkedIn

Si el usuario ya respondió algo, no volver a preguntar.

### Si la carpeta no existe o está vacía
Decirle que no hay contexto y continuar preguntando lo esencial.

---

## Matrices de copywriting — elegí la que mejor encaje

Son frameworks de referencia, no recetas con tiempos fijos. Claude decide la duración de cada parte según el contenido.

**AIDA** — cuando el producto necesita explicación o la audiencia no lo conoce
- Atención → Hook impactante que para el scroll
- Interés → Qué hace y qué problema resuelve
- Deseo → Beneficio concreto o prueba social
- Acción → CTA claro y directo

**PAS** — cuando hay un pain point muy claro
- Problema → Nombrar el dolor del usuario
- Agitación → Consecuencias de no resolverlo
- Solución → El producto como salida + CTA

**Hook-first** — cuando el objetivo es retención máxima desde el primer segundo
- Hook → Afirmación polémica o pregunta poderosa
- Revelación → La respuesta o valor prometido
- CTA → Acción específica

Si ninguna encaja perfectamente, combiná o inventá la estructura que mejor sirva al mensaje.

---

## Reglas técnicas — NO negociables

- **Dimensiones:** exactamente 1080×1920px, siempre
- **Señal de fin:** incluir SIEMPRE al final del script:
  ```javascript
  setTimeout(() => {
    window.parent.postMessage({ type: "gsd:done" }, "*");
  }, DURACION_MS);
  ```
  Sin esta señal el grabador no sabe cuándo cortar.
- **Zona segura:** no poner texto en los primeros ni últimos 150px de alto
- **Sin assets locales:** solo Google Fonts, SVG inline o emojis
- **Sin audio:** lo maneja el sistema de grabación
- **Fuentes:** solo Google Fonts o system fonts

---

## Libertad creativa — acá Claude decide

**Diseño:** Respetá los colores de marca del contexto leído. El resto — tipografía, layout, animaciones, ritmo visual — elegilo para que el mensaje impacte y se entienda rápido. En publicidad, urgencia y claridad son lo primero.

**Duración:** La necesaria para que el mensaje llegue completo sin perder al espectador. Ni tan corto que quede incompleto, ni tan largo que aburra.

**Estilo visual:** Bold, elegante, minimalista, vibrante — lo que mejor represente la marca y enganche a su audiencia.

**CTA:** Que sea claro, directo y aparezca al final. El espectador tiene que saber exactamente qué hacer después de ver el ad.

---

## Estructura base del HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080">
  <title>[Nombre del ad]</title>
  <link href="https://fonts.googleapis.com/css2?family=[Fuente]&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background: [color de marca];
      font-family: '[Fuente]', sans-serif;
    }
    /* El resto del diseño es libre */
  </style>
</head>
<body>

  <!-- Contenido animado acá -->

  <script>
    const DURACION_MS = [duración total en ms];

    // Animaciones y lógica acá

    // ⚠️ OBLIGATORIO — nunca omitir
    setTimeout(() => {
      window.parent.postMessage({ type: "gsd:done" }, "*");
    }, DURACION_MS);
  </script>
</body>
</html>
```

---

## Dónde guardar

```
context_ptojects/
└── [Producto]/
    └── ejemplos_ads/
        ├── [producto]-[matriz]-[plataforma]-v[n].html
        └── caption-[tema].txt
```

---

## Caption sugerido

Generar junto con el HTML:

```
=== INSTAGRAM / FACEBOOK ===
[Hasta 2200 chars. Con emojis y hashtags al final]

=== LINKEDIN ===
[Hasta 3000 chars. Profesional, sin hashtags agresivos]

=== X / TWITTER ===
[Hasta 257 chars. Directo]
```

Guardar como `caption-[nombre-del-ad].txt` en la misma carpeta.

---

## Entregables

1. **HTML** guardado en la carpeta del producto
2. **Caption .txt** para cada plataforma relevante
3. **Una línea de resumen:** duración | matriz usada | plataforma

---

## Checklist antes de entregar

- [ ] 1080×1920px exacto
- [ ] Señal `gsd:done` presente con timeout correcto
- [ ] Sin texto en los primeros/últimos 150px
- [ ] Sin assets locales
- [ ] Fuentes de Google Fonts o system fonts
- [ ] Hook impactante al inicio
- [ ] CTA claro al final
- [ ] Caption generado
- [ ] Colores respetan la marca del contexto leído