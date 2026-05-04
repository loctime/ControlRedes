# Audio Library

Coloca aqui tus audios base para que el bot de Telegram sugiera 3 opciones por prompt.

Formatos soportados:
- `.mp3`
- `.wav`
- `.ogg`
- `.m4a`
- `.aac`

Opcional: crear `index.json` para mejorar la seleccion semantica.

Ejemplo `index.json`:

```json
[
  {
    "id": "voces-corporativo-01",
    "file": "voces-corporativo-01.mp3",
    "tags": ["voces", "corporativo", "ambiente", "suave"],
    "description": "Ambiente oficina con voces de fondo, bajo perfil."
  },
  {
    "id": "impacto-tech-01",
    "file": "impacto-tech-01.mp3",
    "tags": ["tech", "impacto", "moderno", "energetico"],
    "description": "Base ritmica para anuncios de tecnologia."
  }
]
```

Uso en Telegram:

`/sonido nombre-post | prompt`

Ejemplo:

`/sonido promo-luz | ambiente de voces suave corporativo`

El bot enviara 3 audios. Responde `1`, `2` o `3`.
Luego copia la opcion elegida a:

`nuevas-publicaciones/nombre-post.<ext>`

