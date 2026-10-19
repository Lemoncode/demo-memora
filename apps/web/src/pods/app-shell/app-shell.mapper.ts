import type { NavigationApiModel } from './api/navigation.api-model';
import type { Navigation } from './app-shell.model';

/**
 * «Sofía Martín» → «SM»: la primera letra de las dos primeras palabras, en mayúscula.
 */
const derivarIniciales = (nombreCompleto: string): string =>
  nombreCompleto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0))
    .join('')
    .toUpperCase();

/**
 * El mapeo completo de la respuesta de navegación a su ViewModel (R43).
 *
 * «Completo» aquí significa tres cosas concretas, y las tres son trabajo de verdad:
 * renombra los campos del backend, **tira `email`** — que el raíl no dibuja y que un
 * consumidor no debería tener que ignorar — y **deriva las iniciales**, que el
 * *fallback* del `Avatar` espera hechas. Después de esto nadie tiene que renombrar,
 * recortar ni calcular nada: si hiciera falta, el límite estaría roto (R41).
 */
export const mapNavigationFromApi = (navegacion: NavigationApiModel): Navigation => ({
  identity: {
    name: navegacion.viewer.full_name,
    initials: derivarIniciales(navegacion.viewer.full_name),
    avatarUrl: navegacion.viewer.avatar_url,
  },
  // El orden es el del dataset, que es el que `Profile-D` dibuja en su raíl (R54). Y
  // nada más: el ViewModel del círculo tiene **nombre y portada**, porque es lo único
  // que la fixture declara (R48) y lo único que la sección dibuja.
  circles: navegacion.circles.map((circulo) => ({
    name: circulo.name,
    coverUrl: circulo.cover_url,
  })),
});
