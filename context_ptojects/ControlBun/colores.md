# ControlBun — Paleta de Marca y Guía Visual para Publicidades

## Colores de marca (brand tokens de brand.css)

| Rol | Color | Hex | Uso |
|-----|-------|-----|-----|
| Navy principal | Azul marino oscuro | `#143A6B` | Fondo primario, estructuras |
| Navy profundo | Azul noche | `#0E2A4F` | Fondos oscuros en capas |
| Navy máximo | Negro azulado | `#081A33` | Fondos full-dark, gradientes |
| Verde acción | Verde vivo | `#22A745` | CTA, éxito, confirmaciones, badges |
| Verde oscuro | Verde profundo | `#1B8A39` | Hover del verde, sombras |
| Dorado | Gold | `#D4A24C` | Acento premium, números grandes, highlights |
| Dorado oscuro | Gold sombra | `#B98837` | Gradientes del dorado |
| Crema | Off-white | `#F6F2E8` | Texto sobre oscuro |
| Fondo app | Gris muy claro | `#F5F7FA` | Fondos claros |
| Tinta | Casi negro | `#0B1420` | Texto sobre claro |
| Muted | Gris medio | `#6B7785` | Texto secundario, labels |
| Línea | Gris borde | `#E4E8EE` | Separadores, bordes |
| Telegram blue | Azul Telegram | `#229ED9` | Íconos/UI de Telegram |

---

## Paleta recomendada para ads

### Combinación primaria (premium dark — la identidad de ControlBun)
- Fondo: `radial-gradient(ellipse at top, #143A6B 0%, #081A33 60%, #050E1E 100%)`
- Acento dorado: `#D4A24C` (números grandes, badges, highlights)
- Acento verde: `#22A745` (CTA, checks, confirmaciones)
- Texto: `#F6F2E8` (crema sobre oscuro)

### Combinación split (problema → solución)
- Mitad superior: `#143A6B` (navy) con texto `#F6F2E8`
- Mitad inferior: `#F5F7FA` (claro) con texto `#0B1420`
- Badge de solución: fondo `#22A745`, texto blanco

### Combinación limpia (clara, profesional)
- Fondo: `#F5F7FA`
- Primario: `#143A6B`
- Acento: `#D4A24C` o `#22A745`
- Texto: `#0B1420`

---

## Tipografía

| Rol | Fuente | Peso | Import |
|-----|--------|------|--------|
| Display / títulos grandes | **Manrope** | 800 (ExtraBold) | Google Fonts |
| Cuerpo / UI | **Inter** | 400–600 | Google Fonts |
| Código / datos / labels mono | **JetBrains Mono** | 400–500 | Google Fonts |

```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Identidad visual

- Estilo: **premium dark** — navy profundo + dorado + verde
- Concepto: velocidad (30s), automatización, IA, Telegram
- Elementos visuales clave: UI de Telegram (burbujas de chat), checkmarks verdes, números grandes en dorado
- Contraste: fondos muy oscuros con texto crema, acentos dorados para premium

---

## Reglas de uso en ads

1. **El dorado es el color de diferenciación** — úsalo en números, titulares y CTA de alta jerarquía
2. **El verde solo para éxito, confirmación y CTA** — nunca como fondo dominante
3. **Navy profundo como base** — el fondo más correcto es `#081A33` o el gradiente radial
4. **Manrope ExtraBold para headlines** — letra apretada (`letter-spacing: -0.03em`), impacto visual
5. **Mockups de Telegram** en los ads refuerzan el producto — burbujas de chat, íconos de bot
6. **El crema (`#F6F2E8`) sobre oscuro** — más sofisticado que blanco puro

---

## Assets disponibles

| Archivo | Ruta | Uso |
|---------|------|-----|
| Banner | `ControlBun/ControlBun-banner.png` | Presentaciones, cabeceras |
| Logo component | `ControlBun/logo.jsx` (CBLogo) | Modo `light` y `dark` |
| brand.css | `ControlBun/brand.css` | Todos los tokens de color y tipografía |
