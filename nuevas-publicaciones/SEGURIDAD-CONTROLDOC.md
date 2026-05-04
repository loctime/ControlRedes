# Seguridad en la Plataforma Control

En Control tomamos la seguridad de tu información como una prioridad. A continuación te explicamos, de forma clara, cómo protegemos tu cuenta y tus datos en todos nuestros productos: ControlDoc, ControlAudit y el resto de la suite.

---

## Cifrado de comunicaciones

Toda la comunicación entre tu navegador y nuestras plataformas está cifrada con **HTTPS y TLS 1.2**. Esto significa que ningún tercero puede interceptar o leer los datos que enviás o recibís.

- Las conexiones HTTP simples son rechazadas automáticamente y redirigidas a HTTPS.
- Utilizamos **SSL en modo Full Strict**, lo que garantiza que la conexión está cifrada de extremo a extremo: desde el navegador hasta nuestros servidores, sin interrupciones.
- **HSTS activado por 1 año** — los navegadores recuerdan conectarse siempre de forma segura, sin posibilidad de caer en conexiones sin cifrar, incluso si el usuario escribe la dirección manualmente.

---

## Infraestructura protegida por Cloudflare

Toda la plataforma está protegida por **Cloudflare**, uno de los proveedores de seguridad web más grandes del mundo. Todos los subdominios de controldoc.app tienen el proxy de Cloudflare activo, lo que significa que las IPs reales de nuestros servidores nunca quedan expuestas públicamente.

- **Protección contra ataques DDoS** — todo el tráfico pasa por la red de Cloudflare antes de llegar a nuestros servidores. Los ataques de saturación son absorbidos y bloqueados automáticamente.
- **Firewall de aplicaciones web (WAF)** — el WAF gestionado de Cloudflare filtra solicitudes maliciosas conocidas en tiempo real.
- **Rate limiting** — limitamos automáticamente la cantidad de solicitudes que puede hacer una misma IP: máximo 50 requests cada 10 segundos. Superar ese umbral genera un bloqueo temporal automático, protegiendo contra ataques de fuerza bruta y abuso de la API.
- **Proxy activo en todos los subdominios** — las IPs reales de Vercel y Render permanecen ocultas detrás de la red de Cloudflare.
- **DNS seguro** — la gestión de DNS está centralizada en Cloudflare, con protección contra envenenamiento de caché y ataques de spoofing.

---

## Almacenamiento seguro de archivos

Los archivos subidos a nuestras plataformas se almacenan en **Backblaze B2**, un proveedor de almacenamiento en la nube de nivel empresarial. Las medidas de seguridad incluyen:

- **Bucket privado** — ningún archivo es accesible públicamente por URL directa. Todo acceso está restringido y autenticado.
- **URLs firmadas con expiración** — cuando un usuario autorizado necesita acceder a un archivo, se genera una URL temporal firmada que expira automáticamente.
- **Cifrado en reposo** — todos los archivos se almacenan cifrados en los servidores de Backblaze, protegiéndolos incluso ante accesos físicos no autorizados.

---

## Correo electrónico seguro

Nuestros correos electrónicos (notificaciones, alertas, reportes) están configurados con los tres estándares de autenticación de email:

- **SPF** — verifica que los correos realmente provienen de nuestra plataforma.
- **DKIM** — firma digital que garantiza que el correo no fue alterado en tránsito.
- **DMARC** — política activa que instruye a los servidores de email a rechazar cualquier correo que intente hacerse pasar por nosotros.

Esto protege a nuestros clientes de phishing y correos falsificados.

---

## Alojamiento en proveedores confiables

La plataforma Control utiliza infraestructura de proveedores líderes a nivel mundial:

- **Vercel** — plataforma de despliegue con alta disponibilidad, certificados SSL automáticos y despliegues atómicos. Todos nuestros productos (ControlDoc, ControlAudit, entre otros) están desplegados en Vercel.
- **Render** — servidores backend con entornos aislados y actualizaciones de seguridad continuas.

Todos los proveedores cumplen con estándares internacionales de seguridad.

---

## Código fuente privado

El código fuente de los productos principales de Control está alojado en **repositorios privados de GitHub**. Esto significa que:

- El código de nuestras plataformas no es accesible públicamente.
- Solo el equipo de desarrollo autorizado tiene acceso a los repositorios.
- Los despliegues están controlados y auditados mediante el historial de commits.

---

## Buenas prácticas que recomendamos a nuestros usuarios

- Usá una contraseña única y segura para tu cuenta.
- No compartás tus credenciales con terceros.
- Si notás actividad inusual en tu cuenta, contactanos de inmediato.

---

## Contacto

¿Tenés preguntas sobre seguridad? Escribinos a **hola@controldoc.app**

---

*Última actualización: mayo 2026*
