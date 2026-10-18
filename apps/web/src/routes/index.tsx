import { createFileRoute } from '@tanstack/react-router';

// El «Hola Mundo» de la tarea #1 ya no está (R74): este grupo lo retira junto con los
// primitivos que lo pintaban. Lo que queda aquí es un marcador de posición hasta T26
// (Grupo 8), que convierte esta ruta en la redirección a `/login` (R61) — que todavía
// no puede escribirse, porque `<Link>`/`redirect` están tipados contra el árbol de
// rutas generado y `/login` no existe hasta el Grupo 9. Inventar una pantalla aquí
// sería desviación de alcance: este grupo entrega la biblioteca de componentes, no una
// ruta.
export const Route = createFileRoute('/')({ component: () => null });
