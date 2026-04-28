# ControlAudit — Paleta de Marca y Guía Visual para Publicidades

## Colores del logo (marca real)

> Estos son los colores que definen la identidad visual de ControlAudit, extraídos del logo oficial.

| Rol | Color | Hex | Uso |
|-----|-------|-----|-----|
| Azul marino (C) | Azul noche | `#1A3557` | Color principal, fondos oscuros, texto sobre claro |
| Verde vivo (A + tilde) | Verde acción | `#3CB54A` | Acento, CTA, éxito, verificación |

---

## Colores de la interfaz (sistema)

> Usados en la app. Pueden usarse en ads para mantener coherencia con el producto.

| Rol | Color | Hex |
|-----|-------|-----|
| Azul de app (links, navbar) | Azul Material | `#1976D2` |
| Fondo general | Gris claro | `#F5F5F5` |
| Fondo de tarjetas | Blanco | `#FFFFFF` |
| Texto principal | Casi negro | `#222222` |
| Texto secundario | Gris medio | `#444444` |
| Borde / separadores | Gris suave | `#E9ECEF` |

---

## Colores semánticos (estado)

| Estado | Color | Hex |
|--------|-------|-----|
| Conforme / OK | Verde | `#28A745` |
| No conforme / Error | Rojo | `#DC3545` |
| A mejorar / Warning | Ámbar | `#FFC107` |
| No aplica / Info | Cian | `#17A2B8` |

---

## Paleta recomendada para ads

### Combinación primaria (más impacto de marca)
- Fondo: `#1A3557` (azul marino)
- Acento / CTA: `#3CB54A` (verde vivo)
- Texto: `#FFFFFF` (blanco)

### Combinación alternativa (limpia y profesional)
- Fondo: `#FFFFFF` (blanco)
- Primario: `#1A3557` (azul marino)
- Acento: `#3CB54A` (verde)
- Texto: `#222222`

### Combinación oscura (premium)
- Fondo: `#111827` (negro azulado)
- Primario: `#3CB54A` (verde)
- Texto: `#FFFFFF`
- Detalle: `#1A3557`

---

## Tipografía

### App (sistema)
La app usa el stack del sistema operativo:
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica Neue, sans-serif
```
Esto significa que **no hay una fuente de marca definida explícitamente**.

### Recomendación para ads
Para mantener coherencia con el estilo de la app (moderno, limpio, sin serif):

| Rol | Fuente sugerida | Estilo |
|-----|----------------|--------|
| Títulos | **Inter** o **Montserrat Bold** | Peso 700-800 |
| Cuerpo / subtítulos | **Inter** o **Roboto Medium** | Peso 400-500 |
| CTA / botones | **Inter Bold** o **Montserrat ExtraBold** | Peso 700 |

> Todas disponibles gratis en Google Fonts. Inter es la más cercana al look de la app.

---

## Identidad visual del logo

- Forma: Letras "C" y "A" combinadas con una tilde de verificación integrada
- Concepto: Control + Auditoría + Verificación (el checkmark)
- Estilo: Geométrico, moderno, sin serif
- Fondo recomendado: Blanco o azul marino (el logo funciona en ambos)

---

## Reglas de uso en ads

1. **Siempre usar el azul marino (`#1A3557`) como color dominante o el verde (`#3CB54A`) como acento** — nunca al revés como paleta principal
2. **El verde solo para elementos de acción** (botones CTA, checkmarks, íconos de éxito)
3. **No usar el azul de app (`#1976D2`) como color de marca** — es del framework MUI, no del branding
4. **Tipografía: nunca serif ni display decorativas** — el estilo es técnico-profesional
5. **Fondos oscuros con texto blanco** funcionan mejor para ads de seguridad/industria
6. **El logo funciona sobre fondo blanco o azul marino** — evitar fondos de color claro que no sea blanco

---

## Assets disponibles

| Archivo | Ruta | Uso |
|---------|------|-----|
| Logo principal | `/public/loguitoaudit.png` | Ads, presentaciones, cabeceras |
| Iconos PWA | `/public/icons/icon-*.png` | Tamaños: 48, 72, 96, 144, 192, 512px |
