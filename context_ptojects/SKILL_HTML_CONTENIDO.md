---
name: html-contenido
description: >
  Crea HTMLs animados de contenido orgánico (no publicidad) para Instagram, LinkedIn,
  Facebook y X/Twitter. Activar SIEMPRE que el usuario pida: reels de contenido,
  carruseles, posts educativos, tips animados, "haceme un reel sobre X", "quiero
  explicar cómo funciona X", "creá contenido de valor sobre X", "haceme un carrusel
  de errores/tips/pasos", o cualquier contenido que no sea publicidad paga.
  Esta skill usa matrices de contenido educativo (Hook-Valor-CTA, Problema-Solución,
  Listicle, Behind the Scenes) y produce HTMLs listos para el pipeline SocialPublisher.
---

# HTML Contenido — Creador de Contenido Educativo Animado (Claude Code)

Los HTMLs que crea esta skill son **contenido orgánico**, no publicidad.
El objetivo no es vender directamente — es **aportar valor, generar confianza y construir audiencia**.

Van a ser grabados y publicados igual que los ads:
1. Grabados por SocialPublisher
2. Convertidos a MP4 (1080x1920, 9:16, H.264)
3. Publicados en redes sociales

---

## Diferencia clave con html-ads

| | html-ads | html-contenido |
|---|---|---|
| Objetivo | Que haga algo (comprar, seguir) | Que aprenda, guarde o comparta |
| Estructura | AIDA / PAS / Hook vendedor | Educativa / narrativa / listicle |
| Tono | Persuasivo, urgente | Útil, cercano, experto |
| CTA | "Comprá", "Escribinos" | "Guardá esto", "¿Te pasó?" |

---

## Sistema de Contextos por App

### Dónde están los contextos

```
context_ptojects/
├── ControlAudit/
│   ├── info.md          ← qué hace la app, público, beneficios
│   ├── colores.md       ← paleta, fuentes
│   ├── capturas/        ← screenshots, logos
│   └── ejemplos_ads/    ← referencia de estilo visual
├── ControlDoc/
└── [OtroProyecto]/
```

### Si el usuario NO dice qué app

1. Listar subcarpetas con `ls` / `dir`
2. Mostrar lista y preguntar: *"¿Para cuál de estas apps querés el contenido?"*
3. Esperar respuesta

### Si el usuario SÍ dice el nombre

Ir directo a leer el contexto. No preguntar cuál app.

### Cómo leer el contexto (Claude Code)

1. `Read` en cada `.md` y `.txt` de la carpeta del producto
2. `LS` en `capturas/` para ver qué imágenes hay disponibles
3. Revisar `ejemplos_ads/` para entender el estilo visual de la marca
4. Construir mentalmente:
   - Qué hace el producto y para quién
   - Qué problemas resuelve (→ ideas de contenido)
   - Colores y estilo de marca
   - Qué se comunicó antes

### Preguntas DESPUÉS de leer el contexto

Solo estas:

1. **¿Sobre qué tema/funcionalidad querés el contenido?**
   - Sugerir temas basados en el contexto leído
   - Ej: *"Detecté estas funcionalidades: auditorías, reportes, alertas. ¿Sobre cuál hacemos contenido? ¿O tenés otro tema en mente?"*

2. **¿Qué formato?** (si no lo dijo)
   - Reel educativo / Carrusel / Post estático

3. **¿Para qué plataforma?** (si no lo dijo)
   - Instagram / LinkedIn / Facebook / X

4. **¿Cuántos segundos o slides?** (si no lo dijo)
   - Default Reel: 20–30s | Carrusel: 5–8 slides | Post: 1 frame

---

## Paso 1: Elegir el formato

### Reel educativo animado
- Video vertical animado, 15–60s
- Ideal para: tips, errores comunes, cómo funciona algo, antes/después
- Una idea por reel, desarrollada en 3–5 pasos visuales

### Carrusel animado
- Secuencia de frames que pasan como slides
- Ideal para: listas, pasos, comparativas, guías
- Entre 4 y 10 slides — el primero es el hook, el último es el CTA
- Cada slide: 3–5s visible antes de transición

### Post estático animado
- Un solo frame con microanimaciones (texto que aparece, elementos que pulsan)
- Ideal para: frases, datos impactantes, anuncios de funcionalidades
- Duración: 5–8s

---

## Paso 2: Elegir la matriz de contenido

### Hook-Valor-CTA (la más versátil)
Usar para: tips, consejos, revelaciones
```
Hook (0-3s)      → Pregunta o afirmación que para el scroll
Valor (3-20s)    → El contenido útil (pasos, tips, explicación)
CTA (20-25s)     → "Guardá esto" / "¿Le pasa a tu empresa?" / "Seguinos"
```

### Listicle (para listas)
Usar para: "3 errores", "5 tips", "4 razones"
```
Intro (0-3s)     → "Los 3 errores más comunes en auditorías"
Item 1 (3-8s)    → Error/tip con ícono o número grande
Item 2 (8-13s)   → Siguiente ítem
Item 3 (13-18s)  → Último ítem
Cierre (18-25s)  → Reflexión + CTA suave
```

### Problema-Solución (para mostrar el producto)
Usar para: mostrar cómo la app resuelve algo real
```
Problema (0-5s)  → Situación que el usuario reconoce
Consecuencia (5-12s) → Qué pasa si no se resuelve
Solución (12-22s)    → Cómo la app lo resuelve (sin vender agresivo)
CTA (22-25s)     → "Conocé más" / "Link en bio"
```

### Behind the Scenes / Cómo funciona
Usar para: mostrar el producto en uso, generar confianza
```
Intro (0-3s)     → "Así funciona [feature] en ControlAudit"
Demo (3-20s)     → Pasos visuales simulando el flujo de la app
Resultado (20-25s) → El beneficio concreto obtenido
```

---

## Paso 3: Specs técnicas

| Formato | Resolución | Duración | Notas |
|---------|------------|----------|-------|
| Reel Instagram | 1080×1920px | 15–60s | Hook en 1.5s, zona segura 150px arriba/abajo |
| Reel LinkedIn | 1080×1920px | 15–60s | Tono más profesional |
| Carrusel | 1080×1920px | 3–5s por slide | Transición suave entre slides |
| Post estático | 1080×1920px | 5–8s | Microanimaciones de entrada |

**Siempre:**
- Canvas: 1080×1920px
- Fuentes: Google Fonts o system fonts
- Sin audio en el HTML
- Sin assets locales (todo inline o Google Fonts)
- Zona segura: sin texto en primeros/últimos 150px

---

## Paso 4: Estructura del HTML

### Reel / Post animado

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080">
  <title>[Nombre del contenido]</title>
  <link href="https://fonts.googleapis.com/css2?family=[Fuente]:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background: [color de marca];
      font-family: '[Fuente]', sans-serif;
    }
    /* Secciones/frames con position: absolute, width: 100%, height: 100% */
    /* @keyframes para entradas y salidas */
    /* Estados iniciales: opacity: 0 */
  </style>
</head>
<body>

  <!-- Frame 1: Hook -->
  <!-- Frame 2: Contenido / pasos -->
  <!-- Frame N: CTA -->

  <script>
    const DURACION_MS = [duración total en ms];

    // Timeline de animación por frame
    // Cada sección aparece y desaparece con setTimeout + classList

    // ⚠️ SEÑAL DE FIN — NUNCA omitir
    setTimeout(() => {
      window.parent.postMessage({ type: "gsd:done" }, "*");
    }, DURACION_MS);
  </script>
</body>
</html>
```

### Carrusel animado

```html
<!-- Mismo base que arriba, pero con lógica de slides -->
<script>
  const slides = document.querySelectorAll('.slide');
  const TIEMPO_POR_SLIDE = 4000; // 4s por slide
  let actual = 0;

  function mostrarSlide(i) {
    slides.forEach(s => s.style.opacity = 0);
    slides[i].style.opacity = 1;
  }

  mostrarSlide(0);

  const intervalo = setInterval(() => {
    actual++;
    if (actual >= slides.length) {
      clearInterval(intervalo);
      // Señal de fin
      setTimeout(() => {
        window.parent.postMessage({ type: "gsd:done" }, "*");
      }, TIEMPO_POR_SLIDE);
      return;
    }
    mostrarSlide(actual);
  }, TIEMPO_POR_SLIDE);
</script>
```

---

## Paso 5: Principios de diseño para contenido educativo

**Tipografía:**
- Números grandes (200px+) para listicles — son el ancla visual
- Headlines: 100–140px, bold o black
- Cuerpo: 60–80px, weight normal
- Máximo 10 palabras por frame en reels rápidos

**Colores:**
- Respetar paleta de marca del contexto leído
- Usar color de acento para destacar el dato clave de cada frame
- Fondo consistente en todos los frames (da identidad)

**Íconos y elementos visuales:**
- Usar emojis grandes como íconos (se renderizan bien en video)
- Checkmarks ✅, números en círculo, flechas →
- Líneas divisoras para separar secciones

**Animaciones para contenido:**
- Más suaves que en ads (el contenido no necesita urgencia)
- `fadeIn` simple: 0.5s–0.8s
- Números que "cuentan" hacia arriba generan engagement
- Subrayados animados bajo palabras clave

---

## Paso 6: CTAs para contenido educativo

A diferencia de los ads, los CTAs de contenido son más suaves:

| Situación | CTA sugerido |
|-----------|-------------|
| Tip útil | "Guardá esto para no olvidarlo" |
| Lista de errores | "¿Cuál de estos cometés?" |
| Cómo funciona algo | "¿Querés verlo en tu empresa?" |
| Dato impactante | "Compartí si te sorprendió" |
| Tutorial/pasos | "Seguinos para más como esto" |

---

## Paso 7: Ideas de contenido por funcionalidad

Cuando se lee el contexto de una app, sugerir estos tipos de contenido:

**Para cualquier funcionalidad:**
- "3 errores que comete tu empresa al [hacer X]"
- "Así funciona [feature] en 30 segundos"
- "Antes vs después de usar [feature]"
- "¿Sabías que podés [beneficio] con [app]?"
- "El proceso de [tarea] en 4 pasos simples"
- "Por qué el 70% de las empresas falla en [tema]"

---

## Paso 8: Dónde guardar los archivos

```
context_ptojects/
└── ControlAudit/
    └── ejemplos_ads/
        ├── controlaudit-tips-3errores-instagram-v1.html
        └── caption-tips-3errores.txt
```

Nombre sugerido: `[producto]-[tipo]-[tema corto]-[plataforma]-v[número].html`

---

## Paso 9: Caption sugerido

```
=== INSTAGRAM / FACEBOOK ===
[Caption conversacional. Emojis, pregunta al final para generar comentarios.
Hashtags al final. Hasta 2200 chars.]

=== LINKEDIN ===
[Caption profesional. Reflexión + dato + pregunta a la comunidad.
Sin hashtags agresivos. Hasta 3000 chars.]

=== X / TWITTER ===
[Hasta 257 chars. La idea más fuerte del contenido, directo.]
```

Guardar como `caption-[nombre].txt` en la misma carpeta del HTML.

---

## Entregables por pedido

1. **Archivo HTML** guardado en la carpeta del proyecto
2. **Caption .txt** para cada plataforma relevante
3. **Resumen**: formato | duración/slides | matriz usada | plataforma

---

## Checklist interno antes de entregar

- [ ] Dimensiones: 1080×1920px exacto
- [ ] Señal `gsd:done` con timeout correcto
- [ ] Hook en los primeros 1.5–3s
- [ ] Texto legible (tamaño y contraste)
- [ ] Matriz de contenido visible en el flujo
- [ ] Sin assets locales
- [ ] Fuentes de Google Fonts o system fonts
- [ ] CTA suave al final (no vendedor)
- [ ] Caption generado
- [ ] Colores/estilo respetan la marca del contexto leído
- [ ] El contenido aporta valor sin vender directamente