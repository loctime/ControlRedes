---
name: html-contenido
description: >
  Crea HTMLs animados de contenido orgánico (no publicidad) para Instagram, LinkedIn,
  Facebook y X/Twitter. Activar SIEMPRE que el usuario pida: reels de contenido,
  carruseles, posts educativos, tips animados, "haceme un reel sobre X", "quiero
  explicar cómo funciona X", "creá contenido de valor sobre X", "haceme un carrusel
  de errores/tips/pasos", o cualquier contenido que no sea publicidad paga.
---

# HTML Contenido — Creador de Contenido Educativo Animado (Claude Code)

## Qué es esto

Contenido orgánico animado para redes sociales. No es publicidad — es valor.
El objetivo es que el espectador aprenda algo, lo guarde o lo comparta.

El HTML va a ser grabado por SocialPublisher y convertido a MP4 (1080×1920, H.264).

---

## Diferencia con html-ads

| | html-ads | html-contenido |
|---|---|---|
| Objetivo | Que haga algo (comprar, seguir) | Que aprenda, guarde o comparta |
| Tono | Persuasivo, urgente | Útil, cercano, experto |
| CTA | "Comprá", "Escribinos" | Invitar a comentar, guardar, seguir |

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

Con eso, entender: qué hace el producto, para quién, qué problemas resuelve, colores y estilo de marca.

### Preguntas después de leer el contexto

Solo las que falten:
1. **¿Sobre qué tema querés el contenido?** → sugerir temas basados en lo leído
2. **¿Qué formato?** → Reel / Carrusel / Post estático
3. **¿Para qué plataforma?** → Instagram / LinkedIn / Facebook / X

Si el usuario ya respondió algo, no volver a preguntar.

---

## Reglas técnicas — NO negociables

Estas reglas son del sistema de grabación y no se pueden cambiar:

- **Dimensiones:** exactamente 1080×1920px, siempre
- **Señal de fin:** incluir SIEMPRE al final del script:
  ```javascript
  setTimeout(() => {
    window.parent.postMessage({ type: "gsd:done" }, "*");
  }, DURACION_MS);
  ```
  Sin esta señal el grabador no sabe cuándo cortar.
- **Zona segura:** no poner texto en los primeros ni últimos 150px de alto
- **Sin assets locales:** solo Google Fonts, SVG inline o emojis. Nada que dependa de archivos del sistema
- **Sin audio:** el audio lo maneja el sistema de grabación, no el HTML
- **Fuentes:** solo Google Fonts o system fonts

---

## Libertad creativa — acá Claude decide

Todo lo que sigue es orientación, no regla. Claude elige lo que mejor sirva al contenido:

**Formato:** Reel animado, carrusel de slides, post con microanimaciones, o lo que tenga más sentido para el tema.

**Narrativa:** Elegí la estructura que mejor cuente la historia — puede ser una lista, una pregunta que se responde, un antes/después, un proceso paso a paso, una revelación, o cualquier otra forma que enganche.

**Diseño:** Respetá los colores de marca del contexto leído. El resto — tipografía, layout, animaciones, elementos visuales — elegilo para que el contenido se entienda de un vistazo en mobile. Priorizá impacto y legibilidad.

**Duración:** La necesaria para que el contenido respire bien. Ni tan corto que quede incompleto, ni tan largo que aburra.

**CTA:** Que invite naturalmente a interactuar — guardar, comentar, compartir, seguir. Sin presión de venta.

---

## Estructura base del HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080">
  <title>[Nombre del contenido]</title>
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
        ├── [producto]-[tema]-[plataforma]-v[n].html
        └── caption-[tema].txt
```

---

## Entregables

1. **HTML** guardado en la carpeta del producto
2. **Caption .txt** con texto para cada plataforma relevante
3. **Una línea de resumen:** formato | duración | plataforma

---

## Checklist antes de entregar

- [ ] 1080×1920px exacto
- [ ] Señal `gsd:done` presente con timeout correcto
- [ ] Sin texto en los primeros/últimos 150px
- [ ] Sin assets locales
- [ ] Fuentes de Google Fonts o system fonts
- [ ] El contenido aporta valor sin vender
- [ ] Caption generado
- [ ] Colores respetan la marca del contexto leído
## Audio embebido (estandar ControlRedes)

- Cuando el usuario pida sonido, generar audio por codigo en el HTML (Web Audio API).
- Exportar ese audio a base64 (preferido: `audio/wav`).
- Antes de cerrar, setear:
  - `window.__GSD_EMBED_AUDIO_BASE64 = <base64>`
  - `window.__GSD_EMBED_AUDIO_MIME = "audio/wav"`
- Luego enviar:
  - `window.parent.postMessage({ type: "gsd:done" }, "*")`
- Si no se setean esos campos, el pipeline exporta silencio.

Snippet minimo:

```javascript
const wavBase64 = buildAudioBase64Somehow();
window.__GSD_EMBED_AUDIO_BASE64 = wavBase64;
window.__GSD_EMBED_AUDIO_MIME = "audio/wav";
window.parent.postMessage({ type: "gsd:done" }, "*");
```

## FAST CONTEXT MODE (obligatorio)

Para bajar consumo y acelerar entrega, este skill debe usar lectura minima:

1. Leer solo:
   - `context_ptojects/<Proyecto>/info.md`
   - `context_ptojects/<Proyecto>/colores.md`
2. No leer ni listar `capturas/` por defecto; solo si el usuario pide usar una captura especifica.
3. PROHIBIDO leer `ejemplos_ads/` en modo normal. Solo si el usuario lo ordena de forma explicita.
4. No leer otros `.md/.txt` fuera de esos paths salvo pedido explicito.
5. Si falta contexto, hacer una sola pregunta corta y luego generar.

Regla de prioridad:
- Este bloque FAST CONTEXT MODE prevalece sobre instrucciones anteriores de lectura amplia dentro de este skill.


## Audio Ready Gate (NO negociable)

Cuando haya audio embebido generado por codigo, **no** enviar `gsd:done` hasta que el audio este listo.

Usar este patron:

```javascript
let audioReady = false;
buildAudio().then(b64 => {
  window.__GSD_EMBED_AUDIO_BASE64 = b64;
  window.__GSD_EMBED_AUDIO_MIME = 'audio/wav';
  audioReady = true;
});

setTimeout(() => {
  const wait = () => {
    if (audioReady) {
      window.parent.postMessage({ type: 'gsd:done' }, '*');
    } else {
      setTimeout(wait, 100);
    }
  };
  wait();
}, DURACION_MS);
```

Si falta este gate, el renderer puede exportar en silencio.

