import type * as React from 'react';
import { cn } from 'cn';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleQuestionMark,
  Clock,
  CloudUpload,
  Download,
  Funnel,
  Heart,
  Hourglass,
  House,
  Images,
  Layers,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Tag,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * El mapa cerrado de nombre → glifo de `lucide-react` (R33): los catorce nombres del
 * README del sistema de diseño y los diecinueve que añade §5 del handoff.
 *
 * **Qué glifo le toca a cada nombre no se ha elegido aquí**: se leyó del `iconMap` del
 * propio sistema de diseño, que es la fuente de verdad del diseño, así que `album` es
 * `layers` y no un álbum, `filter` es `funnel`, `upload` es `cloud-upload`, `edit` es
 * `pencil`, `phone` es `smartphone`, `photos` es `images`, `pin` es `map-pin`,
 * `shield` es `shield-check`, `help` es `circle-question-mark` y `pending` es
 * `hourglass`. Adivinarlos habría dado un conjunto plausible y distinto del diseño.
 */
const ICON_MAP = {
  // Los catorce del sistema de diseño.
  album: Layers,
  arrowRight: ArrowRight,
  chevronDown: ChevronDown,
  clock: Clock,
  download: Download,
  filter: Funnel,
  heart: Heart,
  pin: MapPin,
  shield: ShieldCheck,
  sparkles: Sparkles,
  tag: Tag,
  upload: CloudUpload,
  users: Users,

  // Los diecinueve que añaden los artboards de esta parte.
  arrowLeft: ArrowLeft,
  lock: Lock,
  logout: LogOut,
  photos: Images,
  search: Search,
  home: House,
  help: CircleQuestionMark,
  user: User,
  edit: Pencil,
  phone: Smartphone,
  chevronRight: ChevronRight,
  plus: Plus,
  ban: Ban,
  pending: Hourglass,
  settings: Settings,
  monitor: Monitor,
  sun: Sun,
  moon: Moon,
  mail: Mail,

  // `success` es la entrada canónica de la marca de verificación y `check` su alias,
  // apuntando al **mismo** componente: una sola entrada, como pide R35, de modo que no
  // hay dos que puedan separarse con el tiempo.
  //
  // Canónico es `success` y no `check`, y es una decisión medida. §5 del handoff dice
  // que «`success` y el `check` del README son el mismo glifo»; el `iconMap` del propio
  // sistema de diseño dice lo contrario — ahí `check` es `check` y `success` es
  // `circle-check`, dos glifos distintos. Como **ningún artboard de esta parte usa
  // `check`** (`Register-M` y `Invite-States`, los dos sitios donde aparece la marca,
  // piden `success`), hacer canónico `success` cumple R35 a la letra y pinta además el
  // glifo que el diseño pone en cada sitio donde esta parte lo usa. La consecuencia,
  // dicha para que no sorprenda: un futuro `check` saldrá como `circle-check` y no como
  // la marca pelada del README.
  success: CircleCheck,
  check: CircleCheck,
} as const;

export type IconName = keyof typeof ICON_MAP;

/**
 * El mapa como `Map` y no como objeto indexado, que es la lección que la review del
 * Grupo 1 dejó dos veces: indexar un objeto literal consulta `Object.prototype`, así
 * que `ICON_MAP['constructor']` devuelve una función y el componente intentaría
 * pintarla. Un `Map` no tiene claves heredadas **en absoluto**, así que el conjunto que
 * `Icon` acepta no puede ser más grande que esta tabla por construcción.
 */
const ICONS = new Map<string, LucideIcon>(Object.entries(ICON_MAP));

export const ICON_NAMES = Object.keys(ICON_MAP) as readonly IconName[];

/**
 * Un icono del vocabulario de Memora.
 *
 * **Decorativo por omisión**: lleva `aria-hidden` y no se anuncia, porque en los
 * artboards el icono casi siempre acompaña a una etiqueta visible que ya dice lo
 * mismo. Cuando el icono **es** la única información, se le pasa `label` y entonces sí
 * se anuncia (`role="img"` + `aria-label`).
 *
 * **Regla de uso de los tintes accent (R36, §5 «Do / Don't»).** Un icono tintado con un
 * accent (`accent-*` sobre `accent-*-soft`) **nunca aparece sin una etiqueta de texto
 * visible al lado**: esas parejas miden entre 1,56:1 y 2,87:1 y están exentas del suelo
 * de contraste *sólo porque* la etiqueta carga con el significado. Un icono accent que
 * tenga que significar algo por sí solo usa `semantic.color.success-foreground`
 * (`text-success-foreground`, medido 4,70–5,15) o `semantic.color.link`, que son las dos
 * parejas que el gate de contraste sí mide.
 *
 * Un nombre que no está en el mapa **falla ruidosamente en desarrollo** y pinta nada en
 * producción (R34, D15): un glifo que falta tiene que parar a quien programa, pero no
 * puede dejar en blanco una pantalla a quien revisa.
 */
export const Icon = ({
  name,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<'svg'>, 'ref'> & { name: IconName; label?: string }) => {
  const Glyph = ICONS.get(name);

  if (Glyph === undefined) {
    if (import.meta.env.DEV) {
      throw new Error(
        `«${name}» no está en el mapa de iconos. Añádelo a ICON_MAP o corrige el nombre.`,
      );
    }

    return null;
  }

  return (
    <Glyph
      aria-hidden={label === undefined ? 'true' : undefined}
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      strokeWidth={2}
      className={cn('size-5 shrink-0', className)}
      {...props}
    />
  );
};
