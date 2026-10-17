---
title: Memora — brief funcional
status: reference
date: 2026-10-17
---

# Memora — brief funcional

> Documento de contexto (no es un PRD ni una spec). Describe el producto al que
> sirven todas las tareas del repo. Lo consumen el grill, el Spec Author y el
> Architect para no perder el norte de producto.

## Qué es Memora

Las fotos de un viaje, una boda o un cumpleaños acaban repartidas entre los móviles
de cada persona, chats, nubes y discos. **Memora** es un archivo **privado y
colaborativo** de recuerdos fotográficos: un grupo de personas de confianza (un
**círculo**) reúne sus fotos en álbumes compartidos, etiqueta quién aparece en cada
una y descarga lo que quiera.

**No es una red social**: no hay perfiles públicos, seguidores, likes ni contenido
público.

**Propuesta de valor:** «Todos vuestros recuerdos, por fin, en el mismo lugar».

## Qué se va a construir

Una **aplicación web real** (no una maqueta) que funciona con la misma calidad en
**móvil** y en **escritorio**, instalable en la pantalla de inicio del móvil, con
tema claro y oscuro, **API propia** y datos persistentes.

## Alcance del MVP

- Registro e inicio de sesión.
- Círculos privados con invitación por enlace (con vista previa al compartirlo en un
  chat) o por email.
- Álbumes colaborativos y subida de fotos desde la galería o la cámara del móvil, y
  con arrastrar y soltar en escritorio.
- Galería, vista de foto con autor, fecha, lugar y descripción.
- Etiquetado de personas y filtro «Fotos de esta persona».
- Descarga de fotos y de álbumes completos.
- Perfil, tema claro / oscuro / sistema y permisos por círculo.

## No objetivos (explícitos)

- Perfiles públicos, seguidores, likes, feed público.
- Descubrimiento de contenido entre desconocidos.
