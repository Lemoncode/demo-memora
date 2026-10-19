/**
 * La tarjeta de cristal de `Login-D`, abajo a la izquierda sobre el mosaico (R96).
 *
 * **Copia literal de §10, y es suya**: `Register-D` tiene su propia tarjeta con su
 * propio texto, y confundir las dos fue el único error de hecho de la v1 del contrato
 * de diseño. Por eso este componente vive en el pod de `login` y no en `common/`.
 *
 * La segunda oración va en color `link`, que es lo que el artboard dibuja y lo que
 * §9 midió: sobre el cristal (82 % blanco) a 22 px en negrita cuenta como texto grande,
 * con suelo de 3:1.
 *
 * **El cristal es `glass` + desenfoque de 16 px**, los dos del fichero de tokens, así
 * que en oscuro el fondo pasa solo al valor oscuro de `glass.background` sin ninguna
 * variante `dark:`. El desenfoque va por `var()` porque unos píxeles crudos los marcaría
 * el escáner (R17) — que, por cierto, **tampoco perdona un literal dentro de un
 * comentario**: no lee comentarios aparte, así que escribir aquí el valor hexadecimal
 * del token pone el gate en rojo.
 */
export const LoginQuoteCard = () => (
  <div className="absolute bottom-12 left-12 flex max-w-[26.25rem] flex-col gap-3 rounded-panel bg-glass px-6 py-5 shadow-lg backdrop-blur-[var(--primitive-dimension-blur-glass)]">
    <p className="font-heading text-[1.375rem]/[1.25] font-bold">
      Todos vuestros recuerdos,{' '}
      <span className="text-link">por fin, en el mismo lugar.</span>
    </p>
    <p className="text-sm text-body-foreground">
      Sin algoritmos, sin muros públicos y con calidad original.
    </p>
  </div>
);
