/**
 * La tarjeta de cristal de `Register-D`: **su propia copia**, literal de §10 (R93, R96).
 *
 * `/register` se dirige a quien **todavía no tiene cuenta**, así que su promesa es otra
 * que la de `/login`: ahí el argumento es «todos vuestros recuerdos en el mismo lugar»
 * y aquí es la **privacidad** — «solo entra la gente a la que invitas». §4 pide
 * explícitamente no reutilizar la tarjeta de login, y esta es la razón, no la forma.
 *
 * A diferencia de la de login, **esta no tiñe ninguna oración en color `link`**: el
 * artboard la dibuja entera en color de texto. Es una diferencia del diseño, no un
 * olvido.
 */
export const RegisterQuoteCard = () => (
  <div className="absolute bottom-12 left-12 flex max-w-[26.25rem] flex-col gap-3 rounded-panel bg-glass px-6 py-5 shadow-lg backdrop-blur-[var(--primitive-dimension-blur-glass)]">
    <p className="font-heading text-[1.375rem]/[1.25] font-bold">
      Un lugar íntimo para quienes más quieres.
    </p>
    <p className="text-sm text-body-foreground">
      Solo entra la gente a la que invitas. Nadie más ve vuestras fotos.
    </p>
  </div>
);
