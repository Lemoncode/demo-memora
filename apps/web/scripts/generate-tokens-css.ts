/**
 * Generator for `apps/web/src/tokens.generated.css` — the CSS projection of
 * `docs/design-tokens.json`.
 *
 * `projectTokens` is pure: parsed token file in, complete CSS text out. That is what
 * makes it unit-testable without touching the filesystem, and what lets `--check` be a
 * comparison rather than a second code path (#11 D2).
 *
 *   pnpm design-tokens:css        writes apps/web/src/tokens.generated.css
 *   pnpm design-tokens:css:check  fails when the committed file is stale (the gate)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { argv, exit, stderr, stdout } from 'node:process';
import { pathToFileURL } from 'node:url';

/**
 * Resolved from this module rather than from `process.cwd()`, so the generator behaves
 * the same whether it runs from the repo root, from `apps/web`, or from a CI step.
 */
const REPO_ROOT = new URL('../../../', import.meta.url);

export const TOKEN_FILE = new URL('docs/design-tokens.json', REPO_ROOT);
export const OUTPUT_FILE = new URL('apps/web/src/tokens.generated.css', REPO_ROOT);

/** How the two paths read in a message to a human. */
const TOKEN_PATH = 'docs/design-tokens.json';
const OUTPUT_PATH = 'apps/web/src/tokens.generated.css';

interface TokenLeaf {
  readonly path: readonly string[];
  readonly type: string;
  readonly value: unknown;
  /** The `$extensions['com.lemony.modes'].dark` value, when the token declares one. */
  readonly darkValue?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The one mode of `$extensions['com.lemony.modes']` this generator projects. */
const DARK_MODE = 'dark';

/**
 * A token's declared modes, with every key checked against the one the generator knows.
 * The token file's root `$description` forecasts `matcha` / `caramelo` / `espresso` as
 * themes someone may expose later: the day a mode value for one lands here, this stops
 * the generator instead of ignoring it, which would leave the committed CSS quietly not
 * matching the token file with all seven gates green — the second half of R6, «never
 * silently omit a token from its output».
 */
function modesOf(
  path: readonly string[],
  node: Record<string, unknown>,
): Record<string, unknown> {
  const extensions = isRecord(node.$extensions) ? node.$extensions : {};
  const modes = isRecord(extensions['com.lemony.modes'])
    ? extensions['com.lemony.modes']
    : {};

  for (const mode of Object.keys(modes)) {
    if (mode === DARK_MODE) continue;

    throw new Error(
      `Token "${dotted(path)}" declares the mode "${mode}" in ` +
        `$extensions['com.lemony.modes'], which this generator does not project — it ` +
        `projects "${DARK_MODE}" only. Teach it that mode (it needs its own selector in ` +
        'the projection) rather than letting the value be ignored: an ignored mode ' +
        'leaves the committed CSS not matching the token file with every gate green.',
    );
  }

  return modes;
}

/** Every leaf of the token tree, in the token file's own order. */
function collectLeaves(node: unknown, path: readonly string[] = []): TokenLeaf[] {
  // Anything that is not an object is neither a group nor a token, and returning `[]`
  // for it dropped it without a word (R6).
  if (!isRecord(node)) {
    const where = path.length === 0 ? "the token file's root" : `Node "${dotted(path)}"`;

    throw new Error(
      `${where} in docs/design-tokens.json is ${
        Array.isArray(node) ? 'an array' : `of type ${typeof node}`
      } where a token (an object with a $value) or a group of tokens belongs.`,
    );
  }

  if ('$value' in node) {
    const modes = modesOf(path, node);

    return [
      {
        path,
        type: String(node.$type),
        value: node.$value,
        ...(Object.hasOwn(modes, DARK_MODE) ? { darkValue: modes[DARK_MODE] } : {}),
      },
    ];
  }

  const children = Object.entries(node).filter(([key]) => !key.startsWith('$'));

  // A node with no `$value` and no children is neither a group nor a projectable leaf.
  // It used to be walked past, contributing nothing and saying nothing — a token the
  // output omits in silence, which is the half of R6 that forbids exactly that. The
  // shape shows up for real as a token carrying only a mode override.
  if (children.length === 0) {
    throw new Error(
      `Node "${dotted(path)}" in docs/design-tokens.json holds no $value and no child ` +
        'tokens, so nothing about it reaches the projection. Give it a $value (a token) ' +
        'or child tokens (a group); it must not be silently omitted.',
    );
  }

  return children.flatMap(([key, child]) => collectLeaves(child, [...path, key]));
}

/** `fontFamily` → `font-family`, so the generated CSS is all lowercase. */
const kebab = (segment: string): string =>
  segment.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** The custom property a token is projected to: its path, dots turned to hyphens. */
const customProperty = (path: readonly string[]): string =>
  `--${path.map(kebab).join('-')}`;

/** A family name needs quoting as soon as it carries a space. */
const quoteFamily = (family: string): string =>
  /\s/.test(family) ? `'${family}'` : family;

/**
 * Deliberately free of anything volatile — no timestamp, no version, no hostname — so
 * that two runs over the same token file produce byte-identical output and the
 * regeneration gate only ever fires on a real change (R3).
 */
const HEADER = `/* Memora design tokens — generated file, do not edit by hand.
 *
 * Source:    docs/design-tokens.json — the canonical, client-owned token file
 * Generator: apps/web/scripts/generate-tokens-css.ts (pnpm design-tokens:css)
 * Gate:      pnpm design-tokens:css:check — fails when this file is stale
 *
 * To change a value, edit the token file and regenerate; never edit this file.
 * The header carries no timestamp or version on purpose: the gate compares bytes.
 */`;

const dotted = (path: readonly string[]): string => path.join('.');

const REFERENCE = /^\{([^}]+)\}$/;

/**
 * A `{token.path}` reference becomes `var(--…)` of that token's own property, so the
 * semantic tier keeps aliasing the primitive tier at runtime — which is what makes a
 * dark mode of ~22 primitive overrides propagate through the whole projection.
 */
function projectReference(
  path: readonly string[],
  target: string,
  known: ReadonlySet<string>,
): string {
  if (!known.has(target)) {
    throw new Error(
      `Token "${dotted(path)}" references "${target}", which no token in ` +
        'docs/design-tokens.json defines. A dangling reference would project as a ' +
        'var(--…) pointing at nothing.',
    );
  }

  return `var(${customProperty(target.split('.'))})`;
}

type Projector = (path: readonly string[], type: string, value: unknown) => string;

/**
 * Written exactly as the token file holds them — six- and eight-digit hex, rem, px, ms,
 * and the unitless numbers a line height or a font weight needs. No re-encoding, so the
 * CSS stays comparable to the JSON by eye. (No literal example in this comment on
 * purpose: the anti-hardcode scan reads this file too.)
 */
const asWritten: Projector = (path, type, value) => {
  // String() would turn an object into `[object Object]` and an array into a bare
  // comma list — plausible-looking CSS nobody would notice was wrong. The array types
  // below are shape-checked by `asArray`; this is the same guard for the scalar ones.
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(
      `Token "${dotted(path)}" has $type "${type}", which projects from a string or a ` +
        `number, but its $value is ${Array.isArray(value) ? 'an array' : `of type ${typeof value}`}.`,
    );
  }

  return String(value);
};

/**
 * The `$type`s this generator projects, and how — one table, so the set it accepts and
 * the set it knows how to write can never drift apart. A `$type` absent from here stops
 * the generator (R6); it is never guessed at and never dropped.
 */
const PROJECTORS = new Map<string, Projector>([
  ['color', asWritten],
  ['dimension', asWritten],
  ['duration', asWritten],
  ['number', asWritten],
  ['fontWeight', asWritten],
  [
    'fontFamily',
    (path, _type, value) =>
      asArray(path, value)
        .map((family) => quoteFamily(String(family)))
        .join(', '),
  ],
  [
    'cubicBezier',
    (path, _type, value) => `cubic-bezier(${asArray(path, value).join(', ')})`,
  ],
]);

/**
 * The projector for a `$type`, or a loud stop naming the token path (R6).
 *
 * A `Map` rather than an object literal, because indexing an object literal reaches
 * `Object.prototype`: a `$type` of `constructor` or `toString` then passed the
 * membership test and projected silently. A `Map` has no inherited keys at all, so the
 * set this accepts cannot be larger than the table — the property matters more than the
 * one-line `Object.hasOwn` guard that would also have fixed today's symptom.
 */
function projectorFor(path: readonly string[], type: string): Projector {
  const projector = PROJECTORS.get(type);

  if (projector === undefined) {
    throw new Error(
      `Unknown $type "${type}" at token "${dotted(path)}". ` +
        `generate-tokens-css projects ${[...PROJECTORS.keys()].join(', ')}. ` +
        'Teach the generator this type rather than letting the token drop out of ' +
        'the projection (apps/web/scripts/generate-tokens-css.ts).',
    );
  }

  return projector;
}

/** A token's `$value` as CSS text, per its `$type` (R5). */
function projectValue(
  path: readonly string[],
  type: string,
  value: unknown,
  known: ReadonlySet<string>,
): string {
  // The type gate comes first, so it holds for every shape a `$value` can take — a
  // `{token.path}` reference included. Resolving the reference first would let a token
  // with an unknown `$type` project silently as a var(), which is the one thing R6
  // forbids; the gate is order-independent now, the way `assertProjected` already was.
  const projector = projectorFor(path, type);

  if (typeof value === 'string' && /[{}]/.test(value)) {
    const reference = REFERENCE.exec(value);

    // A value that mentions a reference but is not exactly one — `"{a.b} {c.d}"`, say —
    // would otherwise fall through and be written out with its braces intact.
    if (reference?.[1] === undefined) {
      throw new Error(
        `Token "${dotted(path)}" has a $value that mentions a {token.path} reference but ` +
          'is not exactly one, and this generator projects a whole-value reference only. ' +
          'Split it into its own tokens rather than letting the braces reach the CSS.',
      );
    }

    return projectReference(path, reference[1], known);
  }

  return projector(path, type, value);
}

function asArray(path: readonly string[], value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `Token "${dotted(path)}" must hold an array $value for its $type, got ${typeof value}.`,
    );
  }

  return value;
}

/**
 * The committed map of token subtrees this generator projects (#11 D2, R6). Every leaf
 * of the token file has to fall under one of these, or the generator stops: a token in
 * an unmapped subtree would otherwise be dropped from the projection silently, which is
 * worse than no generator at all. Adding a subtree here is the deliberate act of
 * deciding how it projects.
 */
const PROJECTED_SUBTREES = [
  'primitive.color',
  'primitive.dimension',
  'primitive.fontFamily',
  'primitive.fontWeight',
  'primitive.number',
  'primitive.duration',
  'primitive.cubicBezier',
  'semantic.color',
  'semantic.radius',
  'semantic.motion',
  'semantic.typography',
  // One entry, not one per component: every component subtree projects identically, so
  // adding a component's tokens needs no decision here.
  'component',
] as const;

function assertProjected(path: readonly string[]): void {
  const token = dotted(path);
  const covered = PROJECTED_SUBTREES.some(
    (subtree) => token === subtree || token.startsWith(`${subtree}.`),
  );

  if (covered) return;

  throw new Error(
    `Token "${token}" lies outside every subtree the generator projects ` +
      `(${PROJECTED_SUBTREES.join(', ')}). Decide how it projects by adding its ` +
      'subtree to PROJECTED_SUBTREES in apps/web/scripts/generate-tokens-css.ts ' +
      'rather than leaving it out of the projection.',
  );
}

/**
 * The committed map from token subtree to Tailwind namespace (#11 D2, R12). These are
 * the tokens the screens reach for as utilities — `bg-primary`, `rounded-card`,
 * `font-body`, `p-4`. Everything else stays a plain custom property: plumbing the
 * semantic tier aliases, not a utility anyone writes.
 */
const THEME_SUBTREES = [
  { subtree: 'semantic.color', namespace: '--color-' },
  { subtree: 'semantic.radius', namespace: '--radius-' },
  { subtree: 'semantic.typography', namespace: '--font-', stripSuffix: '-family' },
  { subtree: 'primitive.dimension.space', namespace: '--spacing-' },
] as const;

/**
 * Tokens that enter `@theme` as literals rather than as `var()` references, because
 * Tailwind resolves them at build time. A breakpoint is the whole list: `nav:` has to
 * become `@media (width >= 76.875rem)`, which a var() cannot express.
 */
const THEME_LITERALS = [
  { token: 'primitive.dimension.layout.breakpoint-nav', key: '--breakpoint-nav' },
] as const;

/** The `@theme inline` key for a token, or undefined when the map does not expose it. */
function themeKey(path: readonly string[]): string | undefined {
  const token = dotted(path);

  for (const rule of THEME_SUBTREES) {
    const prefix = `${rule.subtree}.`;
    if (!token.startsWith(prefix)) continue;

    const name = token.slice(prefix.length).split('.').map(kebab).join('-');
    const stripped =
      'stripSuffix' in rule && name.endsWith(rule.stripSuffix)
        ? name.slice(0, -rule.stripSuffix.length)
        : name;

    return `${rule.namespace}${stripped}`;
  }

  return undefined;
}

const declare = (
  leaf: TokenLeaf,
  value: unknown,
  known: ReadonlySet<string>,
  indent: string,
): string =>
  `${indent}${customProperty(leaf.path)}: ${projectValue(leaf.path, leaf.type, value, known)};`;

export function projectTokens(tokenFile: unknown): string {
  const leaves = collectLeaves(tokenFile);
  for (const leaf of leaves) assertProjected(leaf.path);

  const known = new Set(leaves.map((leaf) => dotted(leaf.path)));
  const overridden = leaves.filter((leaf) => leaf.darkValue !== undefined);

  const base = leaves.map((leaf) => declare(leaf, leaf.value, known, '  ')).join('\n');

  // Only the tokens that declare a dark value appear here. The semantic tier aliases
  // the primitive tier through var(), so overriding a primitive propagates upwards and
  // the whole dark mode is a couple of dozen declarations rather than a second palette.
  const dark = overridden
    .map((leaf) => declare(leaf, leaf.darkValue, known, '  '))
    .join('\n');
  const darkIndented = overridden
    .map((leaf) => declare(leaf, leaf.darkValue, known, '    '))
    .join('\n');

  // `inline` on purpose: the utility carries `var(--semantic-color-…)` itself, so a
  // dark override of the underlying custom property repaints it with no second theme.
  const theme = leaves
    .flatMap((leaf) => {
      const key = themeKey(leaf.path);

      return key === undefined ? [] : [`  ${key}: var(${customProperty(leaf.path)});`];
    })
    .join('\n');

  // A literal rule projects the token it names when the file holds it. That the real
  // token file does hold `breakpoint-nav` is pinned by a test over the file itself,
  // rather than by a throw here — which would make every partial fixture unprojectable.
  const literals = THEME_LITERALS.flatMap((rule) => {
    const leaf = leaves.find((candidate) => dotted(candidate.path) === rule.token);

    return leaf === undefined
      ? []
      : [`  ${rule.key}: ${projectValue(leaf.path, leaf.type, leaf.value, known)};`];
  }).join('\n');

  const sections = [
    { open: ':root {', declarations: base, close: '}' },
    {
      open: "/* Theme «Oscuro» — chosen explicitly. */\n[data-theme='dark'] {",
      declarations: dark,
      close: '}',
    },
    {
      open:
        '/* Theme «Sistema» — the same overrides, behind the OS preference (R10). */\n' +
        "@media (prefers-color-scheme: dark) {\n  [data-theme='system'] {",
      declarations: darkIndented,
      close: '  }\n}',
    },
    {
      open: '/* The token-backed Tailwind utilities the screens use (R12). */\n@theme inline {',
      declarations: theme,
      close: '}',
    },
    {
      open: '/* Resolved at build time, so these are literals, not var() references. */\n@theme {',
      declarations: literals,
      close: '}',
    },
  ];

  const body = sections
    // An empty rule says nothing; a partial token file simply has fewer blocks.
    .filter((section) => section.declarations !== '')
    .map((section) => `${section.open}\n${section.declarations}\n${section.close}`)
    .join('\n\n');

  return `${HEADER}\n\n${body}\n`;
}

export interface ProjectionCheck {
  readonly ok: boolean;
  readonly message: string;
}

/**
 * The gate's verdict, as a pure comparison: `committed` is the file on disk, or `null`
 * when there is none. Pure and exported because this one comparison is the difference
 * between a gate and a gate that is green while guarding nothing — the CLI around it is
 * wiring, but this is tested (R7).
 */
export function checkProjection(committed: string | null, css: string): ProjectionCheck {
  if (committed === css) {
    return {
      ok: true,
      message: `design-tokens:css:check OK: ${OUTPUT_PATH} is up to date.`,
    };
  }

  if (committed === null) {
    return {
      ok: false,
      message:
        `design-tokens:css:check FAILED: ${OUTPUT_PATH} does not exist.\n` +
        'Run `pnpm design-tokens:css` to write it, and commit the result.',
    };
  }

  return {
    ok: false,
    message:
      `design-tokens:css:check FAILED: ${OUTPUT_PATH} is stale — it no longer matches ` +
      `${TOKEN_PATH}.\nRun \`pnpm design-tokens:css\` and commit the result.`,
  };
}

// ---------------------------------------------------------------------------------
// CLI. Wiring only — the logic that can break lives in `projectTokens` and
// `checkProjection`, and the gate is exercised for real in #11 T5.
// ---------------------------------------------------------------------------------

function main(): number {
  const css = projectTokens(JSON.parse(readFileSync(TOKEN_FILE, 'utf8')));

  if (!argv.includes('--check')) {
    writeFileSync(OUTPUT_FILE, css);
    stdout.write(`design-tokens:css wrote ${OUTPUT_PATH} from ${TOKEN_PATH}\n`);

    return 0;
  }

  // An absent file is a failure too, reported in words rather than as a raw ENOENT.
  const committed = existsSync(OUTPUT_FILE) ? readFileSync(OUTPUT_FILE, 'utf8') : null;
  const result = checkProjection(committed, css);

  (result.ok ? stdout : stderr).write(`${result.message}\n`);

  return result.ok ? 0 : 1;
}

// Only when run as a script: the spec imports `projectTokens` from here, and must not
// trip the filesystem on import.
if (argv[1] !== undefined && import.meta.url === pathToFileURL(argv[1]).href) {
  exit(main());
}
