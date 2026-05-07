# ControlBun — Contexto de Marca para Publicidades

## Qué es

ControlBun es un bot de Telegram que automatiza la gestión de documentación en **controldocumentario.com** (CD) — la plataforma que usan las empresas constructoras para gestionar documentos de contratistas (certificados, seguros, recibos de sueldo, vencimientos, etc.).

CD es complejo y tedioso de usar. ControlBun lo resuelve todo desde Telegram: mandás un PDF, la IA lo clasifica y sube al requerimiento correcto en CD. En 30 segundos.

---

## A quién va dirigida

- Empresas constructoras con contratistas y personal en obra
- Responsables de documentación, RRHH y administración
- Encargados de obra que manejan PDFs de subcontratistas
- Cualquier empresa que carga documentación mensual a controldocumentario.com

---

## Problema central

CD es la plataforma obligatoria pero tiene una UX horrible:
- Navegar entre requerimientos, adjuntar PDFs uno por uno
- Cortar manualmente PDFs con múltiples documentos
- Grabar el parte mensual en un formulario tedioso
- Revisar vencimientos en tablas difíciles de leer

---

## Lo que hace ControlBun (comandos reales)

| Acción | Cómo |
|--------|------|
| Subir PDFs con IA | Mandás el PDF → la IA clasifica cada página y sube a CD automáticamente |
| Ver pendientes | `/pendientes` — lista todos los requerimientos pendientes |
| Ver vencimientos | `/vencimientos` — semáforo 🔴🟠🟡 con días restantes |
| Parte mensual | `/partemes` — o automático el día 1 de cada mes a las 08:00 |
| Subir sin IA | `/unico` — elegís el requerimiento vos mismo |
| Gestionar mapeos | `/mapeos` o desde `mapeos.controldoc.app` |

---

## Cómo funciona la IA

Una sola llamada al modelo: le da las imágenes de referencia de todos los mapeos aprendidos + todas las páginas del PDF nuevo + los requerimientos pendientes en CD. La IA devuelve la asignación automáticamente, sea un PDF de 5 o 50 páginas.

---

## Antes vs. con ControlBun

| Tarea | Sin ControlBun | Con ControlBun |
|-------|---------------|----------------|
| Subir PDFs | Navegar manualmente por cada requerimiento | Mandás el PDF → confirmás → listo |
| Cortar un PDF multi-documento | Herramienta externa + subir cada parte | Automático |
| Parte mensual | Navegar formulario CD, marcar cada fila | Automático el día 1 |
| Ver vencimientos | Entrar a CD, navegar tablas | `/vencimientos` o alerta diaria |

---

## Frases clave (para usar en ads)

- **Eje principal:** Subí tu documentación en 30 segundos desde Telegram
- **Diferencial:** La IA clasifica sola — vos solo mandás el PDF
- **Urgencia:** Vencimientos, partes mensuales, cumplimiento — todo automático
- **Confianza:** Sin apps extra, funciona en el celular, desde la obra

### Palabras clave para ads
`documentación laboral`, `bot Telegram`, `30 segundos`, `IA clasifica`, `vencimientos automáticos`, `empresas constructoras`, `parte mensual`, `controldocumentario`, `sin papel`, `desde el celular`

---

## Datos de contacto / dominio

- Dominio principal: `controldoc.app`
- Panel de mapeos: `mapeos.controldoc.app`
- Plataforma de destino: `controldocumentario.com`
- Email: `contacto@controldoc.app`

---

## Lo que NO es ControlBun

- No es la plataforma CD — es la interfaz de acceso rápido a ella
- No reemplaza controldocumentario.com — lo hace usable
- No requiere instalar nada — 100% Telegram

---

## Contexto de uso del agente de publicidades

- `info.md` + `colores.md` son suficientes para generar ads
- Para detalle técnico completo: leer `controlbun.md` en esta misma carpeta
- Audiencia primaria: constructoras y RRHH con personal en obra
