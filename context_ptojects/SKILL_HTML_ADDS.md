---
name: html-ads
description: >
  Crea HTMLs animados listos para grabar como video y publicar en Instagram Reels,
  LinkedIn, Facebook y X/Twitter. Activar SIEMPRE que el usuario pida: crear un HTML
  de publicidad, anuncio, post animado, creatividad para redes, "haceme un ad de X",
  "quiero publicidad para Instagram", "generá un video para LinkedIn", o cualquier
  contenido visual animado para redes sociales. Esta skill conoce las matrices de
  copywriting (AIDA, PAS, Hook), las specs técnicas de cada plataforma, y produce
  HTMLs que funcionan perfectamente en el pipeline de grabación SocialPublisher.
---

# HTML Ads — Creador de Publicidades Animadas (Claude Code)

Los HTMLs que crea esta skill son **fuente de video**, no páginas web. Van a ser:
1. Grabados por el sistema SocialPublisher
2. Convertidos a MP4 (1080x1920, 9:16, H.264)
3. Publicados en redes sociales

---

## Sistema de Contextos por App

### Dónde están los contextos

La carpeta raíz donde se ejecuta Claude Code contiene subcarpetas por producto:

```
context_ptojects/          ← carpeta raíz (el usuario abre la terminal desde acá)
├── ControlAudit/
│   ├── info.md            ← descripción, beneficios, público objetivo
│   ├── colores.md         ← paleta de marca, fuentes
│   ├── capturas/          ← imágenes, screenshots, logos
│   └── ejemplos_ads/      ← HTMLs anteriores de referencia
├── ControlDoc/
│   └── ...
└── [OtroProyecto]/
    └── ...
```

### Si el usuario NO dice qué app quiere

1. Listar subcarpetas disponibles con: `ls` o `dir` en la carpeta actual
2. Mostrar la lista al usuario y preguntar: *"¿Para cuál de estas apps querés el ad?"*
3. Esperar respuesta antes de continuar

### Si el usuario SÍ dice el nombre de la app

Ir directo a leer el contexto. No preguntar cuál app.

### Cómo leer el contexto (Claude Code)

Cuando se sabe qué app es, hacer esto **antes de cualquier otra cosa**:

1. **Leer archivos de texto** → usar `Read` en cada `.md` y `.txt` de la carpeta
2. **Ver qué imágenes hay** → usar `LS` en la subcarpeta `capturas/` (no hace falta abrirlas todas)
3. **Revisar ejemplos anteriores** → leer HTMLs en `ejemplos_ads/` si existen
4. Con todo eso, construir mentalmente:
   - Qué hace el producto
   - A quién va dirigido
   - Qué problemas resuelve
   - Colores y estilo de marca
   - Qué se comunicó antes (para no repetir o mejorar)

### Preguntas DESPUÉS de leer el contexto

Solo estas (no más):

1. **¿Sobre qué funcionalidad/tema querés el ad?**
   - Mostrar las funcionalidades detectadas en el contexto como opciones
   - Ej: *"Encontré: auditorías automáticas, reportes en tiempo real, alertas. ¿Sobre cuál?"*

2. **¿Para qué plataforma?** (si no lo dijo) → Instagram / LinkedIn / Facebook / X

3. **¿Cuántos segundos?** (solo si no está claro) → Default: 15s Instagram, 20s LinkedIn

Si el usuario ya respondió algo en su mensaje inicial, no volver a preguntar.

### Si la carpeta no existe o está vacía

Decirle:
> *"No encontré contexto para [NombreApp]. Podés crear la carpeta con un info.md, o contame vos directamente qué querés comunicar."*

Y continuar con el flujo normal del Paso 1.

---

## Paso 1: Entender el pedido (sin contexto de app)

**Preguntas esenciales:**
- ¿Qué producto/servicio/marca se anuncia?
- ¿Plataforma destino? (Instagram, LinkedIn, Facebook, X)
- ¿Qué acción queremos que haga el espectador?
- ¿Cuántos segundos? (default: 15s Instagram, 20s LinkedIn)

**Opcionales** (si no las menciona, tomá decisiones vos):
- ¿Colores de marca o elegimos?
- ¿El texto lo provee o lo generamos?
- ¿Hay imágenes o solo texto/formas?
- ¿Estilo visual? (minimalista, bold, elegante, vibrante)

Si hay suficiente contexto, arrancá directo sin preguntar.

---

## Paso 2: Elegir la matriz de copywriting

### AIDA — el estándar
Usar cuando: el producto necesita explicación o la audiencia no lo conoce
```
Atención (0-3s)   → Hook visual/textual impactante
Interés (3-10s)   → Qué hace / qué problema resuelve
Deseo (10-18s)    → Beneficio concreto o prueba social
Acción (18-25s)   → CTA claro y directo
```

### PAS — para un pain point claro
```
Problema (0-4s)   → Nombrar el dolor del usuario
Agitación (4-12s) → Consecuencias de no resolverlo
Solución (12-25s) → El producto como salida + CTA
```

### Hook-first — scroll stopper
Usar cuando: el objetivo es retención máxima en los primeros 3s
```
Hook (0-3s)        → Afirmación polémica o pregunta poderosa
Revelación (3-15s) → La respuesta/valor prometido
CTA (15-20s)       → Acción específica
```

---

## Paso 3: Specs técnicas por plataforma

| Plataforma | Resolución | Duración recomendada | Estilo |
|------------|------------|----------------------|--------|
| Instagram Reels | 1080×1920px | 15–30s | Bold, dinámico, hook en 1.5s |
| Facebook Reels | 1080×1920px | 15–30s | Similar a Instagram |
| LinkedIn | 1080×1920px | 15–45s | Profesional, legible |
| X / Twitter | 1080×1920px | hasta 2min 20s | Directo, conciso |

**Siempre:**
- Canvas: 1080×1920px sin excepción
- Fuentes: Google Fonts o system fonts (nunca fuentes locales)
- Animaciones: usar `transform` y `will-change: transform`
- Sin audio en el HTML
- Zona segura: no poner texto en los primeros ni últimos 150px de alto

---

## Paso 4: Estructura del HTML

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
      background: [color];
      font-family: '[Fuente]', sans-serif;
    }
    /* Elementos con position: absolute */
    /* @keyframes para animaciones */
    /* Estados iniciales: opacity: 0 */
  </style>
</head>
<body>

  <!-- Elementos del anuncio aquí -->

  <script>
    const DURACION_MS = [duración en ms];

    // Lógica de animación JS si hace falta

    // ⚠️ SEÑAL DE FIN — NUNCA omitir
    setTimeout(() => {
      window.parent.postMessage({ type: "gsd:done" }, "*");
    }, DURACION_MS);
  </script>
</body>
</html>
```

> ⚠️ La señal `gsd:done` es crítica. Sin ella el grabador no sabe cuándo cortar y usa 60s de fallback.

---

## Paso 5: Principios de diseño para video

**Tipografía:**
- Mínimo 60px para texto secundario, 100px+ para headlines
- Alto contraste siempre
- Máximo 2 fuentes
- Máximo 8 palabras por pantalla en el hook

**Colores:**
- Paleta de 2-3 colores
- Un color de acento para el CTA
- Sin degradados complejos (se pixelan al comprimir)

**Animaciones:**
- Entradas: `fadeIn + translateY` o `scaleIn`
- Timing: 0.4s–0.8s por transición
- `ease-out` para entradas, `ease-in` para salidas
- Esperar 0.3s entre elementos secuenciales

**Evitar:**
- Rotaciones 3D complejas
- Muchos elementos a la vez
- Texto pequeño
- Fondos con mucho ruido

---

## Paso 6: Dónde guardar el archivo HTML generado

Guardar el HTML en la carpeta del proyecto correspondiente:

```
context_ptojects/
└── ControlAudit/
    └── ejemplos_ads/
        └── controlaudit-hook-instagram-v1.html   ← acá
```

Nombre sugerido: `[producto]-[matriz]-[plataforma]-v[número].html`

---

## Paso 7: Caption sugerido

Junto con el HTML, generar el caption para cada plataforma:

```
=== INSTAGRAM / FACEBOOK ===
[Caption hasta 2200 chars. Con emojis y hashtags al final]

=== LINKEDIN ===
[Caption profesional hasta 3000 chars. Sin hashtags agresivos]

=== X / TWITTER ===
[Caption hasta 257 chars. Directo]
```

Guardar como `caption-[nombre-del-ad].txt` en la misma carpeta del HTML.

---

## Entregables por cada pedido

1. **Archivo HTML** guardado en la carpeta del proyecto
2. **Caption .txt** con texto para cada plataforma
3. **Resumen breve**: duración | resolución | matriz usada

---

## Checklist interno antes de entregar

- [ ] Dimensiones exactas: 1080×1920px
- [ ] Señal `gsd:done` presente con timeout correcto
- [ ] Hook en los primeros 1.5–3s
- [ ] Texto legible (tamaño y contraste)
- [ ] Matriz de copywriting visible en el flujo
- [ ] Sin assets locales (imágenes externas o data:base64 inline)
- [ ] Fuentes de Google Fonts o system fonts
- [ ] CTA claro al final
- [ ] Caption generado
- [ ] Colores/estilo respetan la marca del contexto leído