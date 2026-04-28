# Instrucciones para Claude Code — ControlRedes

Estás trabajando en el sistema de creación de contenido para redes sociales de ControlRedes.
Leé todo esto antes de arrancar cualquier tarea.

---

## Dónde estás parado

Carpeta raíz: `C:\Users\User\Desktop\Proyectos\ControlRedes\context_ptojects`

Desde acá tenés acceso a todo:
- Las carpetas de cada producto/app con su contexto
- Los skills con instrucciones detalladas
- Los ejemplos anteriores generados

---

## Estructura de carpetas

```
context_ptojects/
├── CLAUDE.md                     ← este archivo (instrucciones generales)
├── SKILL_HTML_ADDS.md            ← instrucciones para crear publicidades
├── SKILL_HTML_CONTENIDO.md       ← instrucciones para crear contenido orgánico
│
├── ControlAudit/
│   ├── info.md                   ← qué hace la app, beneficios, público
│   ├── colores.md                ← paleta de colores y fuentes de marca
│   ├── obtener_datos.md          ← instrucciones especiales de esta app (si hay)
│   ├── iniciar-claude.bat        ← ignorar, es del sistema
│   └── ejemplos_ads/             ← HTMLs generados anteriormente (referencia)
│       └── Capturas de pantalla/ ← imágenes de la app para usar como contexto visual
│
├── ControlDoc/
│   ├── info.md
│   ├── colores.md
│   └── ejemplos_ads/
│
└── [OtroProyecto]/
    └── ...
```

---

## Tus dos herramientas principales

### 1. SKILL_HTML_ADDS.md → Publicidades
Leer cuando el usuario pida:
- "haceme un ad de X"
- "quiero publicidad para Instagram/LinkedIn"
- "creá un anuncio de X"
- cualquier contenido con objetivo de venta o conversión

### 2. SKILL_HTML_CONTENIDO.md → Contenido orgánico
Leer cuando el usuario pida:
- "haceme un reel de X"
- "quiero contenido educativo sobre X"
- "creá un carrusel de tips/errores/pasos"
- cualquier contenido que aporte valor sin vender directamente

---

## Cómo arrancar cualquier tarea

### Paso 1 — Identificar qué skill usar
Según lo que pide el usuario, decidir si es publicidad o contenido.
En caso de duda, preguntar: *"¿Querés que sea publicitario (para vender) o contenido de valor (para educar)?"*

### Paso 2 — Leer el skill correspondiente
Leer el archivo `.md` del skill antes de hacer cualquier cosa.
El skill tiene todas las instrucciones detalladas: matrices, specs técnicas, estructura HTML, etc.

### Paso 3 — Identificar el producto
Si el usuario no dijo de qué app, listar las carpetas disponibles y preguntar.
Si ya lo dijo, ir directo al paso 4.

### Paso 4 — Leer el contexto del producto
Antes de generar nada, leer:
1. `[Producto]/info.md` → qué hace, para quién, qué resuelve
2. `[Producto]/colores.md` → paleta y fuentes de marca
3. `[Producto]/obtener_datos.md` → si existe, tiene instrucciones especiales
4. `[Producto]/ejemplos_ads/` → revisar HTMLs anteriores para mantener coherencia visual
5. Las imágenes/capturas disponibles → para entender el estilo visual del producto

### Paso 5 — Hacer solo las preguntas necesarias
Con el contexto leído, hacer el mínimo de preguntas.
Los skills indican exactamente qué preguntar en cada caso.

### Paso 6 — Generar y guardar
Crear el HTML y guardarlo en `[Producto]/ejemplos_ads/` y en la carpeta `/nuevas-publicaciones/[Producto]/`
Nombre: `[producto]-[tipo]-[tema]-[plataforma]-v[número].html`
También guardar el caption como `.txt` en la misma carpeta.

---

## Reglas generales

- **Siempre leer el contexto del producto antes de generar** — nunca inventar colores, nombres o beneficios
- **Nunca usar assets locales en el HTML** — solo Google Fonts e imágenes inline (base64) o SVG
- **Siempre incluir la señal `gsd:done`** en el JavaScript del HTML — es crítica para el sistema de grabación
- **Respetar las dimensiones**: 1080×1920px sin excepción
- **Guardar siempre en la carpeta del producto**, no en la raíz

---

## Si hay dudas sobre qué hacer

1. Leer el skill correspondiente — tiene la respuesta
2. Si el contexto del producto no tiene la info que necesitás, preguntar al usuario
3. Nunca inventar información del producto