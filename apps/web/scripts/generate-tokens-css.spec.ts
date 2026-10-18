// @vitest-environment node
// `projectTokens` is a pure function from a parsed token file to CSS text — no DOM
// anywhere — so this spec opts out of the project's jsdom default.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { TOKEN_FILE, checkProjection, projectTokens } from './generate-tokens-css';

// Every fixture that needs a colour literal — the token file AND the value the
// assertion expects — lives in JSON, not here: the anti-hardcode scan reads `.ts`
// anywhere in the repo, and `tokens.generated.css` is the only path allowed to be
// excluded from it (R16). Cases with no colour in them are written inline.
interface ColourCase {
  readonly tokens: unknown;
  readonly expected: Record<string, string>;
}

const cases = JSON.parse(
  readFileSync(
    new URL('./__fixtures__/token-cases.fixture.json', import.meta.url),
    'utf8',
  ),
) as Record<string, ColourCase>;

const singleColor = cases.singleColor as ColourCase;

/** The declarations of one block, so a test can say which block a value lands in. */
const blockOf = (css: string, selector: string): string => {
  const start = css.indexOf(selector);
  expect(start, `block ${selector} not found`).toBeGreaterThan(-1);

  return css.slice(start + selector.length, css.indexOf('}', start));
};

describe('projectTokens', () => {
  it('proyecta un token de color como propiedad personalizada en el bloque :root', () => {
    const css = projectTokens(singleColor.tokens);

    expect(css).toContain(':root {');
    expect(css).toContain(
      `--primitive-color-brand-500: ${singleColor.expected.brand500};`,
    );
  });

  it('abre con una cabecera que prohíbe la edición y nombra origen, script y gate', () => {
    const css = projectTokens(singleColor.tokens);

    expect(css.startsWith('/*')).toBe(true);

    const header = css.slice(0, css.indexOf('*/'));

    expect(header).toContain('do not edit');
    expect(header).toContain('docs/design-tokens.json');
    expect(header).toContain('apps/web/scripts/generate-tokens-css.ts');
    expect(header).toContain('pnpm design-tokens:css:check');
  });

  it('proyecta un array fontFamily como lista separada por comas, citando los nombres con espacios', () => {
    const css = projectTokens({
      primitive: {
        fontFamily: {
          display: {
            $type: 'fontFamily',
            $value: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'sans-serif'],
          },
        },
      },
    });

    // The camelCase group name `fontFamily` kebab-cases into the property name, so the
    // generated CSS is all lowercase like the rest of it.
    expect(css).toContain(
      "--primitive-font-family-display: 'Plus Jakarta Sans', Inter, -apple-system, sans-serif;",
    );
  });

  it('proyecta un array cubicBezier como función cubic-bezier()', () => {
    const css = projectTokens({
      primitive: {
        cubicBezier: { standard: { $type: 'cubicBezier', $value: [0.16, 1, 0.3, 1] } },
      },
    });

    expect(css).toContain(
      '--primitive-cubic-bezier-standard: cubic-bezier(0.16, 1, 0.3, 1);',
    );
  });

  it('falla ruidosamente ante un $type desconocido, nombrando la ruta del token', () => {
    // The subtree is one the namespace map covers, so the only thing wrong here is
    // the `$type` — a silently dropped token is exactly what R6 forbids.
    const project = () =>
      projectTokens({
        primitive: { color: { brand: { 500: { $type: 'shadow', $value: 'none' } } } },
      });

    expect(project).toThrow(/primitive\.color\.brand\.500/);
    expect(project).toThrow(/shadow/);
  });

  it('falla igual ante un $type desconocido cuyo $value es una referencia', () => {
    // The type gate has to hold whatever shape the `$value` takes. When reference
    // resolution ran first, this projected silently as `var(--…)`: an unknown `$type`
    // emitted anyway is exactly the hole R6 exists to close.
    const project = () =>
      projectTokens({
        primitive: {
          dimension: { radius: { lg: { $type: 'dimension', $value: '1rem' } } },
        },
        component: {
          card: {
            shadow: { $type: 'shadow', $value: '{primitive.dimension.radius.lg}' },
          },
        },
      });

    expect(project).toThrow(/component\.card\.shadow/);
    expect(project).toThrow(/shadow/);
  });

  it('falla ante un $type heredado de Object.prototype, con valor literal o referencia', () => {
    // `PROJECTORS[type]` on an object literal reaches Object.prototype, so names like
    // `constructor` or `toString` passed the membership test and projected silently —
    // the accepted set was larger than the table. Same defect class as the early
    // `return`: the set that guards and the set that writes must be one set.
    const inherited = [
      'constructor',
      'toString',
      'valueOf',
      'hasOwnProperty',
      '__proto__',
      'isPrototypeOf',
    ];

    for (const type of inherited) {
      for (const $value of ['1rem', '{primitive.dimension.radius.lg}']) {
        const project = () =>
          projectTokens({
            primitive: {
              dimension: {
                radius: {
                  lg: { $type: 'dimension', $value: '1rem' },
                  xl: { $type: type, $value },
                },
              },
            },
          });

        expect(project, `${type} / ${$value}`).toThrow(
          /primitive\.dimension\.radius\.xl/,
        );
      }
    }
  });

  it('rechaza un $value cuya forma no es escalar en lugar de escribir [object Object]', () => {
    // `fontFamily` and `cubicBezier` were shape-checked from the start; the scalar types
    // went through String(), which turns any shape into plausible-looking CSS.
    const project = () =>
      projectTokens({
        primitive: {
          dimension: { radius: { lg: { $type: 'dimension', $value: { value: 16 } } } },
        },
      });

    expect(project).toThrow(/primitive\.dimension\.radius\.lg/);
    // The message says what the type does accept, so the fix is obvious from it. (The
    // old `not.toThrow(/\[object Object\]/)` here was vacuous: the message interpolates
    // `typeof value`, so that string could never appear in it.)
    expect(project).toThrow(/projects from a string or a number/);
  });

  it('proyecta dimension y duration tal cual, y number y fontWeight sin unidad', () => {
    const css = projectTokens({
      primitive: {
        dimension: { radius: { full: { $type: 'dimension', $value: '9999px' } } },
        duration: { fast: { $type: 'duration', $value: '150ms' } },
        number: { leading: { normal: { $type: 'number', $value: 1.5 } } },
        fontWeight: { semibold: { $type: 'fontWeight', $value: 600 } },
      },
    });

    expect(css).toContain('--primitive-dimension-radius-full: 9999px;');
    expect(css).toContain('--primitive-duration-fast: 150ms;');
    expect(css).toContain('--primitive-number-leading-normal: 1.5;');
    expect(css).toContain('--primitive-font-weight-semibold: 600;');
  });

  it('resuelve una referencia {token.path} al var(--…) de la propiedad de ese token', () => {
    const css = projectTokens({
      primitive: {
        dimension: { radius: { lg: { $type: 'dimension', $value: '1rem' } } },
      },
      semantic: {
        radius: {
          card: { $type: 'dimension', $value: '{primitive.dimension.radius.lg}' },
        },
      },
    });

    expect(css).toContain(
      '--semantic-radius-card: var(--primitive-dimension-radius-lg);',
    );
  });

  it('falla ante un $value que menciona referencias sin ser exactamente una', () => {
    // `"{a.b} {c.d}"` misses the single-reference regex and used to be emitted verbatim,
    // braces and all — CSS that is quietly wrong rather than loudly refused.
    const project = () =>
      projectTokens({
        primitive: {
          dimension: {
            radius: {
              lg: { $type: 'dimension', $value: '1rem' },
              xl: {
                $type: 'dimension',
                $value: '{primitive.dimension.radius.lg} {primitive.dimension.radius.lg}',
              },
            },
          },
        },
      });

    expect(project).toThrow(/primitive\.dimension\.radius\.xl/);
  });

  it('falla ruidosamente ante una referencia a un token inexistente', () => {
    // Not one of R6's two cases, but the same failure mode it exists to prevent: a
    // dangling reference would emit `var(--…)` pointing at nothing — CSS that is
    // quietly broken rather than loudly wrong.
    const project = () =>
      projectTokens({
        semantic: {
          radius: {
            card: { $type: 'dimension', $value: '{primitive.dimension.radius.xxl}' },
          },
        },
      });

    expect(project).toThrow(/semantic\.radius\.card/);
    expect(project).toThrow(/primitive\.dimension\.radius\.xxl/);
  });

  it('expone los valores de com.lemony.modes.dark en los dos bloques oscuros', () => {
    const { tokens, expected } = cases.darkOverride as ColourCase;

    const css = projectTokens(tokens);
    const dark = blockOf(css, "[data-theme='dark'] {");
    const system = blockOf(css, "[data-theme='system'] {");

    // The base block keeps the light value…
    expect(blockOf(css, ':root {')).toContain(
      `--primitive-color-ground-page: ${expected.pageBase};`,
    );

    // …and each dark block carries only the tokens that declare an override, with a
    // reference override still projecting as a var().
    for (const block of [dark, system]) {
      expect(block).toContain(`--primitive-color-ground-page: ${expected.pageDark};`);
      expect(block).toContain('--semantic-color-link: var(--primitive-color-brand-300);');
      expect(block).not.toContain('--primitive-color-static-white');
    }

    // R10: the system block is the same overrides behind the OS preference.
    expect(css).toContain('@media (prefers-color-scheme: dark) {');
    expect(css.indexOf('@media (prefers-color-scheme: dark) {')).toBeLessThan(
      css.indexOf("[data-theme='system'] {"),
    );
  });

  it('pasa tal cual un color hex de 8 dígitos, en base y en oscuro', () => {
    const { tokens, expected } = cases.alphaHex as ColourCase;

    const css = projectTokens(tokens);

    expect(blockOf(css, ':root {')).toContain(
      `--primitive-color-glass-background: ${expected.base};`,
    );
    expect(blockOf(css, "[data-theme='dark'] {")).toContain(
      `--primitive-color-glass-background: ${expected.dark};`,
    );
  });

  it('mapea los subárboles del mapa de namespaces a utilidades de Tailwind en @theme', () => {
    const css = projectTokens({
      primitive: {
        dimension: {
          space: { 4: { $type: 'dimension', $value: '1rem' } },
          radius: { lg: { $type: 'dimension', $value: '1rem' } },
          layout: {
            'content-max': { $type: 'dimension', $value: '80rem' },
            'breakpoint-nav': { $type: 'dimension', $value: '76.875rem' },
          },
        },
        fontFamily: { sans: { $type: 'fontFamily', $value: ['Inter', 'sans-serif'] } },
      },
      semantic: {
        radius: {
          card: { $type: 'dimension', $value: '{primitive.dimension.radius.lg}' },
        },
        typography: {
          'body-family': {
            $type: 'fontFamily',
            $value: '{primitive.fontFamily.sans}',
          },
        },
      },
    });

    const theme = blockOf(css, '@theme inline {');

    expect(theme).toContain('--radius-card: var(--semantic-radius-card);');
    expect(theme).toContain('--spacing-4: var(--primitive-dimension-space-4);');
    // `-family` comes off, so the utility reads `font-body`, not `font-body-family`.
    expect(theme).toContain('--font-body: var(--semantic-typography-body-family);');
    // Unmapped neighbours stay out of @theme — they are plumbing, not utilities.
    expect(theme).not.toContain('content-max');

    // A breakpoint has to be a literal: Tailwind resolves it at build time to write
    // the media query, so it cannot be a var() and cannot be `inline`.
    expect(blockOf(css, '@theme {')).toContain('--breakpoint-nav: 76.875rem;');
  });

  it('mapea semantic.color al namespace --color-* de Tailwind', () => {
    const css = projectTokens((cases.darkOverride as ColourCase).tokens);

    expect(blockOf(css, '@theme inline {')).toContain(
      '--color-link: var(--semantic-color-link);',
    );
  });

  it('falla ante un valor desnudo donde debería haber un token, en vez de omitirlo', () => {
    // A bare string where a token object belongs was skipped by `isRecord` and vanished.
    const project = () => projectTokens({ primitive: { dimension: { radius: '1rem' } } });

    expect(project).toThrow(/primitive\.dimension\.radius/);
  });

  it('falla ante un nodo que no es grupo ni hoja proyectable, en vez de omitirlo', () => {
    // Only a dark override and no $value: nothing to declare in `:root`, so the token
    // produced zero declarations and no error — silently omitted (R6).
    const project = () =>
      projectTokens({
        primitive: {
          dimension: {
            radius: {
              lg: {
                $type: 'dimension',
                $extensions: { 'com.lemony.modes': { dark: '2rem' } },
              },
            },
          },
        },
      });

    expect(project).toThrow(/primitive\.dimension\.radius\.lg/);
  });

  it('falla ante un modo de com.lemony.modes que no sabe proyectar, nombrándolo', () => {
    // The half of R6 that says «never silently omit». The token file's own root
    // $description forecasts `matcha` / `caramelo` / `espresso` as themes someone may
    // expose later; when a mode value for one lands, the projection must stop rather
    // than ignore it while all seven gates stay green.
    const project = () =>
      projectTokens({
        primitive: {
          dimension: {
            radius: {
              lg: {
                $type: 'dimension',
                $value: '1rem',
                $extensions: { 'com.lemony.modes': { matcha: '2rem' } },
              },
            },
          },
        },
      });

    expect(project).toThrow(/primitive\.dimension\.radius\.lg/);
    expect(project).toThrow(/matcha/);
  });

  it('falla ruidosamente ante un subárbol fuera del mapa, nombrando la ruta del token', () => {
    // A known `$type` in a subtree nobody mapped. Projecting it anyway would guess at
    // where it belongs; omitting it would leave a value nobody notices is missing (R6).
    const project = () =>
      projectTokens({
        primitive: { shadow: { card: { $type: 'dimension', $value: '1rem' } } },
      });

    expect(project).toThrow(/primitive\.shadow\.card/);
    expect(project).toThrow(/generate-tokens-css\.ts/);
  });
});

describe('checkProjection', () => {
  // The comparison is the single line between «a gate» and «a gate that is green while
  // guarding nothing», so it is tested even though the CLI around it is wiring.

  it('da OK cuando el fichero comiteado coincide byte a byte con la proyección', () => {
    const result = checkProjection(':root {\n}\n', ':root {\n}\n');

    expect(result.ok).toBe(true);
    expect(result.message).toContain('up to date');
  });

  it('falla, señalando el fichero como obsoleto y el script a ejecutar, si difieren', () => {
    const result = checkProjection(':root {\n}\n', ':root {\n  --a: 1rem;\n}\n');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('apps/web/src/tokens.generated.css');
    expect(result.message).toContain('stale');
    expect(result.message).toContain('pnpm design-tokens:css');
  });

  it('falla diciendo que falta el fichero GENERADO, no el de tokens', () => {
    const result = checkProjection(null, ':root {\n}\n');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('apps/web/src/tokens.generated.css does not exist');
    // The old wording read «tokens.generated.css is missing docs/design-tokens.json»,
    // which names the wrong file as the missing one.
    expect(result.message).not.toMatch(/missing docs\/design-tokens\.json/);
  });
});

describe('projectTokens sobre docs/design-tokens.json', () => {
  const source = readFileSync(TOKEN_FILE, 'utf8');

  /** `fontFamily` → `font-family`; the property-name rule, restated here on purpose. */
  const kebabPath = (path: string): string =>
    `--${path
      .split('.')
      .map((segment) => segment.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`))
      .join('-')}`;

  /**
   * Every node of the file that declares modes, found by the **presence of the
   * extension** rather than by the generator's notion of a leaf. That independence is
   * the point: a node the generator does not treat as a leaf — a token carrying only a
   * mode override, say — is invisible to a `$value`-based count but visible here.
   */
  const pathsDeclaringModes = (node: unknown, path: readonly string[] = []): string[] => {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) return [];

    const extensions = (node as Record<string, unknown>).$extensions;
    const declaresModes =
      typeof extensions === 'object' &&
      extensions !== null &&
      Object.hasOwn(extensions, 'com.lemony.modes');

    return [
      ...(declaresModes ? [path.join('.')] : []),
      ...Object.entries(node)
        .filter(([key]) => !key.startsWith('$'))
        .flatMap(([key, child]) => pathsDeclaringModes(child, [...path, key])),
    ];
  };

  /**
   * The count is computed independently of the generator; the **definition of a leaf**
   * is not — this recurses by the same rule `collectLeaves` uses. So it guards the
   * projection step against dropping a known leaf, and nothing more: a node the
   * generator never considers a leaf is `pathsDeclaringModes`'s business, above.
   */
  const countLeaves = (node: unknown): number => {
    if (typeof node !== 'object' || node === null) return 0;
    if ('$value' in node) return 1;

    return Object.entries(node)
      .filter(([key]) => !key.startsWith('$'))
      .reduce((total, [, child]) => total + countLeaves(child), 0);
  };

  it('declara en :root todas las hojas del fichero, sin omitir ninguna', () => {
    const css = projectTokens(JSON.parse(source));

    const declarations = blockOf(css, ':root {')
      .split('\n')
      .filter((line) => line.trim().startsWith('--'));

    expect(declarations).toHaveLength(countLeaves(JSON.parse(source)));
  });

  it('declara en los dos bloques oscuros cada nodo del fichero que trae modos', () => {
    const css = projectTokens(JSON.parse(source));
    const declared = pathsDeclaringModes(JSON.parse(source));

    expect(declared.length).toBeGreaterThan(0);

    for (const selector of ["[data-theme='dark'] {", "[data-theme='system'] {"]) {
      const block = blockOf(css, selector);
      const declarations = block
        .split('\n')
        .filter((line) => line.trim().startsWith('--'));

      // Each one, by name — and no more than those, so an override can neither go
      // missing nor appear from nowhere.
      for (const path of declared) {
        expect(block, `${path} in ${selector}`).toContain(`${kebabPath(path)}:`);
      }

      expect(declarations).toHaveLength(declared.length);
    }
  });

  it('es estable byte a byte entre dos ejecuciones sobre la misma entrada', () => {
    const first = projectTokens(JSON.parse(source));
    const second = projectTokens(JSON.parse(source));

    expect(second).toBe(first);
    // R3's acceptance is «run the generator twice and `git status` stays clean», so
    // nothing volatile may reach the output: no date, no clock, no version.
    expect(first).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(first).not.toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(first).not.toMatch(/GMT|UTC|generated on/i);
  });

  it('proyecta el breakpoint nav como literal para que Tailwind escriba su media query', () => {
    expect(projectTokens(JSON.parse(source))).toContain('--breakpoint-nav: 76.875rem;');
  });

  it('no arrastra la paleta de shadcn ni los temas que quedan fuera de la entrega', () => {
    const css = projectTokens(JSON.parse(source));

    // R9: nothing of shadcn's `new-york` / `neutral` defaults survives…
    expect(css).not.toContain('oklch(');
    expect(css).not.toContain('--sidebar');
    // …and R18: the three unmeasured themes are absent.
    expect(css).not.toMatch(/matcha|caramelo|espresso/);
  });
});
