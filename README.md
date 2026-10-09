<p align="center">
  <br />
  <a href="https://www.alien.club" target="_blank"><img width="64px" src="https://alien-website.cdn.prismic.io/alien-website/Zrn2b0aF0TcGI3Bu_alien-logo.svg" /></a>
  <h2 align="center">@Alien-Intelligence/eslint-plugin-nitpicker</h2>
  <p align="center">A hyper-pedantic ESLint plugin that flags every stylistic<br />and semantic nit, specifically for AI.</p>
</p>

## What it is
Nitpicker is an ESLint plugin that enforces the small, opinionated conventions a linter usually leaves alone: comment style, JSDoc shape, spelling, decorative noise, and a few semantic anti-patterns. It is built for codebases where humans and AI agents write side by side, so every message is written to make the fix obvious without opening any docs.

Each finding is reported as a problem, a reason, and a concrete fix:
```text
This JSDoc description is 312 characters, over the 250-character limit.
  - why: A JSDoc description should summarize what something is; an oversized
    one usually restates the code or explains how it is used.
  - fix: Trim it to a concise summary of what it does, and drop any note about
    how or where it is used.
```

That reason and fix context is what lets an AI agent (or `eslint --fix`, where the rule supports it) resolve the nit correctly on the first pass.

## Requirements
- **ESLint 9+**, flat config (`eslint.config.js`) only. There is no legacy `.eslintrc` support.
- A parser matching your source. For TypeScript, install [`@typescript-eslint/parser`](https://www.npmjs.com/package/@typescript-eslint/parser). Plain JavaScript uses ESLint's built-in parser.

## Installation
```bash
npm install --save-dev @alien_intelligence/eslint-plugin-nitpicker
```

## Usage
The shared configs are self-contained (they register the plugin under the `nitpicker` key for you), so the simplest setup is to drop one straight into the array:
```js
import nitpicker from "@alien_intelligence/eslint-plugin-nitpicker"

export default [
    nitpicker.configs.recommended,
]
```

For a TypeScript project, add a parser and scope the rules to your source files. Spreading `.rules` into a `files`-scoped block keeps the config from touching everything:
```js
import nitpicker from "@alien_intelligence/eslint-plugin-nitpicker"
import tsParser from "@typescript-eslint/parser"

export default [
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
        },
        plugins: { nitpicker },
        rules: nitpicker.configs.recommended.rules,
    },
]
```

All rules ship as warnings. Promote any of them to errors by overriding the rule level yourself, the same way as any ESLint rule.

## Shared configs
Nitpicker ships seven shared flat configs:
| Config        | What it enables                                                                            |
|---------------|--------------------------------------------------------------------------------------------|
| `recommended` | The universal `base` ruleset, every rule enabled as a warning. The sensible default.       |
| `base`        | The same universal rules, with no framework assumptions.                                   |
| `all`         | Every rule, plus both framework rulesets opted in. The maximally pedantic setup.           |
| `react`       | Opts into the React ruleset for the files you scope it to.                                 |
| `adonisjs`    | Opts into the AdonisJS ruleset, and relaxes decorative separators in `start/routes` files. |
| `breathing`   | Opts into the code-spacing ruleset, which is deliberately out of `recommended`.            |
| `design`      | Opts into the design-system ruleset, also deliberately out of `recommended`.               |

## Rules
The **base** rules are the universal ruleset shipped by `recommended`; the **React**, **AdonisJS**, **breathing**, and **design** rules ship only in their own configs. Every rule is enabled as a warning. The Fixable column marks rules that `eslint --fix` can resolve automatically.

### Base rules
| Rule                                         | Fixable | Description                                                                                         |
|----------------------------------------------|---------|-----------------------------------------------------------------------------------------------------|
| `nitpicker/max-jsdoc-description-length`     |         | Enforce a maximum character length for a JSDoc description (default 250).                           |
| `nitpicker/max-line-comment-length`          |         | Enforce a maximum prose length for a run of consecutive `//` comments (default 200).                |
| `nitpicker/catch-error-name`                 |         | Require a `catch` clause to bind its error as `error` (`_error` for an unused binding).             |
| `nitpicker/no-alias-variables`               |         | Disallow a `const` whose whole value is another variable; use the source directly.                  |
| `nitpicker/no-british-english`               | yes     | Disallow British spellings in identifiers and comments, reporting the American equivalent.          |
| `nitpicker/no-comment-above-jsdoc`           |         | Disallow a comment stacked directly above a JSDoc, splitting one description in two.                |
| `nitpicker/no-decorative-comment-separators` |         | Disallow decorative separators (banners, box-drawing, repeated dashes) inside comments.             |
| `nitpicker/no-em-dash`                       |         | Disallow the em dash (—) character anywhere in the source (`allow` option for copy).                |
| `nitpicker/no-emojis`                        |         | Disallow emoji anywhere in the source (`allow` option for copy). Reported, never auto-removed.      |
| `nitpicker/no-jsdoc-blank-before-tags`       | yes     | Disallow blank lines before JSDoc tags such as `@param` or `@returns`.                              |
| `nitpicker/no-jsdoc-returns-on-void`         | yes     | Disallow a JSDoc `@returns` tag on a function that returns nothing.                                 |
| `nitpicker/no-line-comment-backticks`        | yes     | Disallow backticks in `//` line comments; use double quotes for code references.                    |
| `nitpicker/no-line-comment-period`           | yes¹    | Disallow prose periods in `//` line comments (code dots, quoted spans, ellipses, `e.g.` are OK).    |
| `nitpicker/no-property-access-alias`         |         | Disallow a `const` whose whole value is a single property access; inline the expression instead.    |
| `nitpicker/no-property-destructuring`        |         | Disallow shorthand destructuring off a plain object reference; access the property directly.        |
| `nitpicker/no-relative-imports`              |         | Disallow relative (`./`, `../`) import/re-export paths; use the package alias (`allowIn` option).   |
| `nitpicker/no-single-line-jsdoc`             | yes     | Require JSDoc comments to span multiple lines rather than a single line.                            |
| `nitpicker/require-capitalized-comments`     | yes     | Require a comment to start with an uppercase letter.                                                |
| `nitpicker/require-complete-jsdoc`           |         | Require a function's JSDoc to document every parameter and its return value.                        |
| `nitpicker/require-consistent-member-jsdoc`  |         | Require every interface/type member to be documented once any member is.                            |
| `nitpicker/require-framework-config`         |         | Warn when a file uses a framework whose Nitpicker config is not enabled.                            |
| `nitpicker/require-function-jsdoc`           |         | Require a JSDoc on functions, including class methods and nested ones (`include`/`ignore` options). |
| `nitpicker/require-jsdoc-delimiter-lines`    | yes     | Require a JSDoc's `/**` and `*/` to sit on their own lines, not share one with prose.               |
| `nitpicker/require-member-jsdoc-blank-line`  | yes     | Require a blank line before a documented interface/type member (the first needs none).              |
| `nitpicker/require-multiline-object`         | yes²    | Require an object literal with more than a few properties (default 2) to span multiple lines.       |

### React rules
Shipped by the `react` config (and `all`).
| Rule                                         | Fixable | Description                                                                                         |
|----------------------------------------------|---------|-----------------------------------------------------------------------------------------------------|
| `nitpicker/max-classname-length`             |         | Flag a `className` class string over a max length (default 120); break it up, e.g. via `cn()`.      |
| `nitpicker/no-jsx-comments`                  |         | Disallow inline `{/* ... */}` prose comments inside JSX; extract a named sub-component.             |
| `nitpicker/require-context-hook-destructure` |         | Require the result of a `use*Context` consumer hook to be destructured.                             |
| `nitpicker/require-derived-usememo`          |         | Require a derived value (built via a non-hook call) in a client component or hook to use `useMemo`. |
| `nitpicker/require-hook-object-return`       | yes     | Require a custom hook to return an object rather than a bare function.                              |
| `nitpicker/require-memo-callback-jsdoc`      |         | Require a JSDoc on a `useMemo`/`useCallback` (with an `@param` per `useCallback` parameter).        |

### AdonisJS rules
Shipped by the `adonisjs` config (and `all`).
| Rule                                  | Fixable | Description                                                                                                     |
|---------------------------------------|---------|-----------------------------------------------------------------------------------------------------------------|
| `nitpicker/migration-table-order`     |         | Group migration table statements as columns, then timestamps, then indexes.                                     |
| `nitpicker/no-ctx-httpcontext-param`  |         | Disallow binding the whole `HttpContext`, destructure the properties used (`allowIn` option).                   |
| `nitpicker/require-controller-jsdoc`  |         | Require a JSDoc comment describing an AdonisJS controller (`*Controller` class).                                |
| `nitpicker/require-migration-jsdoc`   |         | Require a JSDoc comment describing an AdonisJS migration.                                                       |
| `nitpicker/require-validated-request` |         | Require request data through `request.validateUsing()`, not raw `request.input/body/qs/all` (`allowIn` option). |

### Breathing rules
Shipped by the `breathing` config (and `all`), never by `recommended`. See [Code breathing](#code-breathing).
| Rule                                    | Fixable | Description                                                                                         |
|-----------------------------------------|---------|-----------------------------------------------------------------------------------------------------|
| `nitpicker/max-consecutive-statements`  |         | Enforce a maximum run of sibling statements with no blank line between them (default 4).            |
| `nitpicker/require-blank-before-block`  | yes     | Require a blank line before a multi-line control-flow block that follows another statement.         |
| `nitpicker/require-blank-before-return` | yes     | Require a blank line before the `return`/`throw` a block of several statements (default 4) ends on. |

### Design rules
Shipped by the `design` config (and `all`), never by `recommended`. See [Design system](#design-system).
| Rule                                      | Fixable | Description                                                                                       |
|-------------------------------------------|---------|---------------------------------------------------------------------------------------------------|
| `nitpicker/no-arbitrary-dimension`        |         | Disallow Tailwind arbitrary px values (`text-[10px]`, `w-[774px]`), which bypass the scales.      |
| `nitpicker/no-centered-table-column`      |         | Disallow centring a `TableHead`/`TableCell`; text goes left, numbers right.                       |
| `nitpicker/no-hand-rolled-surface`        |         | Disallow drawing a card surface by hand in a file that never imports `Card`.                      |
| `nitpicker/no-palette-bypass`             |         | Disallow a semantic `cva` variant using the raw color palette instead of a status token.          |
| `nitpicker/no-raw-color`                  |         | Disallow hex color literals; use a design token (`allowIn` for third-party brand marks).          |
| `nitpicker/no-raw-control-element`        |         | Disallow bare `<button>`/`<input>`/`<select>`/`<textarea>`; use the primitive (`allowIn` option). |
| `nitpicker/no-unwrapped-primitive-import` |         | Disallow importing a symbol from a library when the design system wraps it (`wrapped` option).    |
| `nitpicker/require-dialog-footer`         |         | Require a dialog's action buttons to live in a `DialogFooter` (`allowIn` option).                 |

¹ Only the terminal-period case is auto-fixed; a mid-comment sentence break is reported without a fix so wrapped prose is never mangled.
² Auto-fixed only when the object holds no comments; an object with an inline comment is reported without a fix so the comment is never dropped.

### Rule options
A few rules accept options. Pass them by overriding the rule with a `["warn", { ... }]` tuple.

`max-jsdoc-description-length` takes `{ max: number }`, defaulting to `250`:
```js
"nitpicker/max-jsdoc-description-length": ["warn", { max: 200 }],
```

`max-line-comment-length` takes `{ max: number }`, the cap on the joined prose of a run of consecutive `//` comments, defaulting to `200`. It is tighter than the JSDoc cap because a stacked wall of `//` lines reads worse than a block:
```js
"nitpicker/max-line-comment-length": ["warn", { max: 160 }],
```

`require-function-jsdoc` takes `{ include, ignore }`. `include` picks which function kinds are required on top of top-level ones, out of `"class-methods"`, `"object-methods"` and `"nested"`, defaulting to `["class-methods", "nested"]`. `object-methods` is off by default because callback and visitor objects share the shape of a genuine method bag. `ignore` lists names to skip, for an inherited or framework member whose purpose is fixed by the interface it implements:
```js
"nitpicker/require-function-jsdoc": ["warn", {
    include: ["class-methods", "object-methods", "nested"],
    ignore: ["create", "render"],
}],
```

`require-multiline-object` takes `{ maxKeys, indent, allowIn }`. `maxKeys` is how many properties may stay on one line, defaulting to `2`, and `indent` is the width of one indentation level the fixer expands with, defaulting to `4`. A **record table**, an array of single-line object literals carrying the same keys in the same order, one row per line, is exempt with no configuration, since it is read down its columns and stacking every row trades one scannable block for four times the lines and no alignment:
```ts
const TERMINALS = [
    { command: "wt",   args: ["-d"],      appendDir: true },
    { command: "cmd",  args: ["/c"],      appendDir: false },
    { command: "pwsh", args: ["-NoExit"], appendDir: true },
]
```
An array whose entries carry different keys, a lone literal in an array, and rows packed onto one line are not tables, and still report. `allowIn` is the escape hatch for a file the exemption does not fit:
```js
"nitpicker/require-multiline-object": ["warn", { maxKeys: 3, allowIn: ["**/fixtures/**"] }],
```

`max-classname-length` takes `{ max: number }`, the maximum length of a `className` class string, defaulting to `120`:
```js
"nitpicker/max-classname-length": ["warn", { max: 100 }],
```

`no-british-english` takes `{ extra?: Record<string, string>; ignore?: string[] }` to extend the built-in dictionary or exempt words you want to keep:
```js
"nitpicker/no-british-english": ["warn", {
    extra: { behaviour: "behavior" },
    ignore: ["colour"],
}],
```

`no-decorative-comment-separators` takes `{ allowIn: string[] }`, a list of globs where decorative separators are tolerated:
```js
"nitpicker/no-decorative-comment-separators": ["warn", {
    allowIn: ["**/start/routes.ts"],
}],
```

`no-relative-imports`, `require-validated-request`, and `no-ctx-httpcontext-param` each take the same `{ allowIn: string[] }`, a list of globs exempt from the rule, for the few files where the pattern is unavoidable (an entrypoint that reaches outside the alias roots, a passthrough proxy controller that reads the raw request, or a handler that forwards the context onwards whole):
```js
"nitpicker/no-relative-imports": ["warn", { allowIn: ["**/bin/*.ts"] }],
"nitpicker/require-validated-request": ["warn", { allowIn: ["**/*_proxy_controller.ts"] }],
"nitpicker/no-ctx-httpcontext-param": ["warn", { allowIn: ["**/exceptions/handler.ts"] }],
```

`no-unwrapped-primitive-import` takes `{ wrapped, allowIn }`. `wrapped` maps a package to the symbols your design system re-exports under the same name, and where to import each from. It defaults to `{}`, so the rule does nothing until you describe your own wrapper layer. Key it on the **symbol**, never the package: a wrapper rarely re-exports everything its library does, and a package-level ban buries the one real finding under the correct imports of everything else:
```js
"nitpicker/no-unwrapped-primitive-import": ["warn", {
    wrapped: {
        sonner: { Toaster: "@frontend/components/ui/sonner" },
        "@radix-ui/react-dialog": { DialogTitle: "@frontend/components/ui/dialog" },
    },
}],
```

`require-dialog-footer` and `no-raw-color` each take `{ allowIn: string[] }`, for a dialog family mid-migration and for a third-party brand mark whose color is not yours to tokenize:
```js
"nitpicker/require-dialog-footer": ["warn", { allowIn: ["**/dialogs/admin/**"] }],
"nitpicker/no-raw-color": ["warn", { allowIn: ["**/creditCard.tsx"] }],
```

`no-raw-control-element` takes `{ elements, allowIn }`. `elements` is the tag list, defaulting to `["button", "input", "select", "textarea"]`, and the suggested primitive is the tag capitalized. Prefer exact paths in `allowIn` over directory globs, so a new raw control in the same directory still trips the rule:
```js
"nitpicker/no-raw-control-element": ["warn", {
    allowIn: ["components/grids/datasets.tsx"],
}],
```

`no-arbitrary-dimension` takes `{ properties: string[] }`, the Tailwind prefixes to police, defaulting to `["w", "h", "p", "px", "py", "m", "mx", "my", "gap", "text", "size"]`:
```js
"nitpicker/no-arbitrary-dimension": ["warn", { properties: ["text", "gap"] }],
```

`no-palette-bypass` takes `{ tokens: Record<string, string> }`, mapping a semantic variant name to the token it should use. Your override is merged over the defaults (`success`, `warning`, `error`, `destructive`, `info`) rather than replacing them, so naming one variant does not silently stop policing the rest:
```js
"nitpicker/no-palette-bypass": ["warn", { tokens: { success: "--info" } }],
```

`require-framework-config` takes `{ ignore: ("adonisjs" | "react")[] }`, the frameworks to skip the nudge for:
```js
"nitpicker/require-framework-config": ["warn", { ignore: ["react"] }],
```

`no-em-dash` takes `{ allow: ("strings" | "templates" | "jsx" | "comments")[] }`, the places an em dash is deliberate rather than AI residue, such as user-facing copy, prompt text, or a glyph standing in for an empty value. It defaults to `[]`, i.e. an em dash is reported anywhere. Scope it to the files that hold copy rather than enabling it globally:
```js
{
    files: ["app/legal/**/*.tsx", "app/prompts/**/*.ts"],
    rules: {
        "nitpicker/no-em-dash": ["warn", { allow: ["strings", "templates", "jsx"] }],
    },
}
```

`no-emojis` takes the same `{ allow: ("strings" | "templates" | "jsx" | "comments")[] }` option, for the same reason: an emoji is often deliberate copy or a meaningful marker (a `⚠️` above a risky call). It defaults to `[]`, and it is report-only, never auto-removing a glyph, so an emoji is only ever flagged, not silently deleted:
```js
{
    files: ["app/**/*.tsx"],
    rules: {
        "nitpicker/no-emojis": ["warn", { allow: ["strings", "templates", "jsx"] }],
    },
}
```

### Line comment code references
A backtick renders as code inside a JSDoc block, but in a `//` comment it is just a literal character, so `no-line-comment-backticks` rewrites those references with double quotes:
```js
// Reads `auth.user` from the context  ->  // Reads "auth.user" from the context
```
Backticks are left alone in JSDoc and block comments, in tooling directives, when unpaired, in a run (a ```` ``` ```` fence), and when the span already holds a double quote, since `` `split(".")` `` cannot be requoted without nesting.

### Tooling directives
A directive is not prose, so the rules that read a comment as English leave one alone: `no-line-comment-backticks`, `require-capitalized-comments`, `max-line-comment-length`, `no-comment-above-jsdoc` and `no-jsx-comments`. The set is `eslint`/`eslint-*`, `ts-*`, `biome-ignore`, `prettier-ignore`, `globals`, `exported`, `jshint`, `jslint`, `istanbul`, `c8`/`v8`, `webpack`, `noinspection`, `#region`/`#endregion`, and anything opening with `@`.

This matters most in JSX, where a suppression has to sit directly above the node it suppresses:
```tsx
{/* biome-ignore lint/a11y/noLabelWithoutControl: the control is rendered by the field */}
<label>{title}</label>
```
Extracting that into a named sub-component, which is what `no-jsx-comments` otherwise asks for, would delete a working suppression. A container mixing a directive with real prose still reports, since the prose is what the rule is after.

### Interface member documentation
Two rules keep a documented interface (or type literal) readable. `require-consistent-member-jsdoc` makes documentation all-or-nothing per block, since a lone JSDoc among bare properties reads as an oversight:
```ts
interface StoredTurn {
    sessionId: string
    /**
     * Reasoning text, display only.
     */
    thinking?: string
}
```
Documenting **none** of the members stays perfectly fine, so this only fires once you start. `require-member-jsdoc-blank-line` then keeps them apart, so each JSDoc reads as belonging to the member below it rather than trailing the one above:
```ts
interface P {
    allow_fallbacks?: boolean

    /**
     * Only route to providers that support every parameter.
     */
    require_parameters?: boolean
}
```
The first member of a block needs no blank line above it.

### One description per declaration
`no-comment-above-jsdoc` flags a comment stacked directly on top of a JSDoc:
```ts
// Keyed on the symbol, not the package: a wrapper rarely re-exports everything
// its library does, so a package-level ban would drown the real finding
/**
 * Flags a symbol imported straight from a third-party package when the design
 * system ships a wrapper exporting that same name.
 */
class NoUnwrappedPrimitiveImport { }
```
A reader now has to merge two blocks written in different registers, with nothing saying which belongs where. It is also how a description escapes `max-jsdoc-description-length`, since prose moved above the `/**` is measured as a line-comment run instead, raising the effective ceiling from 250 to 450.

The fix is rarely to merge the two, which would just blow the limit. Implementation rationale belongs **on the code it explains**, leaving the JSDoc to say what the thing is:
```ts
for (const specifier of node.specifiers) {
    // Keyed on the symbol rather than the package, since a wrapper rarely
    // re-exports everything its library does, and a package-level ban would
    // drown the real finding
    const replacement = symbols[specifier.imported.name]
```
Guidance on how to respond to a warning belongs in the rule's own `fix:` message, and guidance on how to wire a config belongs in its docs. A directive (`// biome-ignore`, `// @ts-expect-error`, `// #region`) is exempt, as is a banner on the first line of a file, and a comment separated from the JSDoc by a blank line is left alone.

### JSDoc completeness
`require-complete-jsdoc` only inspects a function that already has a JSDoc (requiring the JSDoc itself is `require-function-jsdoc`'s job). It then checks the doc against the signature:
```js
// Missing @param url, and missing @returns
/**
 * Sends it.
 * @param user The user.
 */
function send(user, url) { return 1 }
```
A **void** or **`Promise<void>`** function needs no `@returns`, and neither does a component returning JSX, a list of it included (`rows.map(row => <Row />)`, `.flatMap`, or an array literal). A parameter named `_`, or prefixed with it, is skipped, since that name says the binding exists only to hold a position, the same convention `catch-error-name` mandates for `_error`:
```ts
/**
 * Handles the broadcast.
 * @param state The state that was broadcast.
 */
function onEvent(_: unknown, state: string) {}
```
A **concise arrow that only forwards a call** is left alone too:
```ts
/**
 * Sends the payload.
 */
const send = () => postPayload()
```
Nothing in that syntax says whether `postPayload()` hands back a value, and requiring a `@returns` would let the brace style decide it: the same body written as `() => { postPayload() }` is visibly void, so a `@returns` on it is what `no-jsdoc-returns-on-void` removes. Annotate the return type and both rules judge it again.

A **destructured** parameter may be documented either way, so both of these pass:
```js
/** @param user The user. @param url The link. */   // property by property
async function send({ user, url }) {}

/** @param options The options. */                   // one name for the whole object
async function send({ user, url }) {}
```
It also covers class methods and object-literal methods, not just top-level functions.

An AdonisJS **route handler** is the one signature documented route-first, describing the endpoint rather than the values the framework hands it. So a parameter destructured off `HttpContext` needs no `@param`, and any function receiving the context needs no `@returns`:
```ts
/**
 * POST /users
 */
async store({ auth, request }: HttpContext) {
    return this.successResponse(...)
}
```
The exemption is keyed on the `HttpContext` annotation, so a destructured parameter of any other type is documented as usual, and a handler's own non-context parameters still need their `@param`. Binding the context whole (`ctx: HttpContext`) is **not** exempt, since it still owes an `@param ctx`, and it is a violation in its own right that `no-ctx-httpcontext-param` reports.

### Line comment periods
`no-line-comment-period` only treats a dot as prose when whitespace or the end of the comment follows it, so dots inside code (`foo.bar`, `subagent.*`, `split(".")`), inside a quoted or back-ticked span, in an ellipsis, or closing an abbreviation (`e.g.`, `i.e.`, `etc.`) are left alone.

The two prose cases are handled differently, since removing a period is only safe at the end of a comment:
```js
// Reads the token.                     ->  // Reads the token
// Reads the token. It is cached        ->  reported, not fixed
const a = 1 // Reads the token. Cached  ->  reported, not fixed
```
Only a terminal period is auto-fixed. A mid-comment period runs two fragments together, and auto-splitting it onto a new line mangles wrapped prose paragraphs, so that case is reported for a human or agent to reword rather than fixed.

## Code breathing
The `breathing` config encodes what a style guide usually calls "code must breathe": blank lines between logical steps, so a function reads as paragraphs rather than as one block of text. Three rules cover it.

`require-blank-before-block` separates a multi-line block from whatever precedes it, and `require-blank-before-return` sets a block's conclusion apart once the block has a few statements in it:
```ts
const rows = await fetchRows()
doSomething(rows)
if (rows.length === 0) {        // ->  blank line here
    return null
}
log(rows)
return rows                     // ->  and here
```
`max-consecutive-statements` then flags a run of statements with no blank line anywhere in it (default 4), which is the case no autofix can resolve, so it is reported without one.

These rules read a statement's leading comments as part of it, so a required blank line goes **above** the comment block rather than between the comment and the code it describes. A comment never counts as separation on its own.

They are deliberately quiet about code that is packed on purpose:
- A declaration immediately consumed by the statement below it (`const user = await find(id)` then `if (!user) return`), which is one thought, not two. Turn this off per rule with `{ allowAfterDeclaration: false }`.
- Single-line guard clauses, however many are stacked.
- A guard the formatter merely wrapped onto two lines, since it has no braced body.
- A run of statements built the same way, such as a schema builder, a block of assertions, or a stack of `useState` calls, which reads as a table rather than as prose. "The same way" means a **shared receiver**: `table.text(...)`, `assert.equal(...)` and `const [a, setA] = useState(...)` each group, since the reader scans one column of differing arguments. A run of *different* functions (`registerA()`, `registerB()`) is not a table, it is the wall of prose the rule is for, so it still counts one statement per line.
- Anything an `else if`, `else`, `catch`, or `finally` introduces, and the space between `switch` cases.

Nothing here ever asks for a blank line next to a brace.

### Opting in
These rules rewrite the whitespace of an existing codebase, so they are **not** in `recommended`, and upgrading Nitpicker never turns them on. Enable them when you are ready:
```js
export default [
    nitpicker.configs.recommended,
    nitpicker.configs.breathing,
]
```
Two of the three are auto-fixable, so `eslint --fix` clears most of the initial pass. If you already run `@stylistic/padding-line-between-statements` or the legacy `newline-before-return`, disable those first, since their fixers will fight these.

## Design system
The `design` config encodes the rules a design system states but cannot enforce: that a primitive is reached through its wrapper, that color and size come from tokens, and that a surface is built from the primitive rather than redrawn by hand. Eight rules cover it.

They assume a shadcn-style layout: a `components/ui` wrapper layer, Tailwind utilities, `cva` variant maps, and CSS-variable tokens. Outside that shape most of them will not fire at all.

### Scoping
Every rule here except `no-palette-bypass` is about **feature** code. The wrapper layer is exactly where importing the library directly, drawing a surface by hand, and rendering a bare `<button>` are the correct thing to do, so exclude it:
```js
{
    files: ["components/**/*.tsx", "app/**/*.tsx"],
    ignores: ["components/ui/**"],
    ...nitpicker.configs.design,
}
```
`no-palette-bypass` is the inverse. It only fires inside a `cva(...)` variant map, which in practice lives in the primitives, so give it its own entry:
```js
{
    files: ["components/ui/**/*.tsx"],
    plugins: { nitpicker },
    rules: { "nitpicker/no-palette-bypass": ["warn", { tokens: { success: "--info" } }] },
}
```

### What is a heuristic and what is not
`no-unwrapped-primitive-import`, `no-centered-table-column`, `no-palette-bypass` and `no-raw-control-element` are exact: they match a symbol, an element name, or a class you either wrote or did not.

`no-hand-rolled-surface` is a heuristic and is meant to stay a warning. It reads the static classes of one `className`, joining the arms of a `cn(...)` call, and asks whether they add up to a rounded bordered card background in a file that never imports `Card`. A bordered region that is legitimately not a card looks identical from there. Its value is prompting the question, not settling it. A single-side border (`border-t` and friends) is excluded, since a divider is not a surface.

`no-raw-color` matches `Literal` and `TemplateElement` nodes only, so a hash in JSX prose (a street address, an anchor) is never a finding. It accepts the four hex lengths CSS allows (3, 4, 6, 8) and ignores the five- and seven-digit strings that cannot be colors.

### Opting in
Like `breathing`, these are **not** in `recommended`, and upgrading Nitpicker never turns them on. None of them is auto-fixable: every finding is a judgement about what a piece of UI is, which no fixer can make. Expect to land them one at a time, cheapest first, rather than all at once.

### Server Components
`require-derived-usememo` is the one React rule that asks you to *add* a hook, so it stays quiet wherever no hook can run. It skips:
- Any `async` component or hook, since React supports no async client component, so an async one always renders on the server.
- A Next.js App Router entry file (`page`, `layout`, `template`, `default`, `loading`, `not-found`) under an `app/` directory that has no top-level `"use client"` directive.

Add the directive and the rule applies again, since the file is then a Client Component. The `error` boundaries are never treated as server files, as React requires those to be client ones. No configuration is needed for either case.

## Framework configs
Some conventions only make sense for a given framework. Nitpicker detects when a file uses React or AdonisJS and, through `require-framework-config`, nudges you to opt into the matching config for those files. Opting in silences that nudge and applies any framework-specific tweaks.

Scope each framework config to the files it applies to:
```js
import nitpicker from "@alien_intelligence/eslint-plugin-nitpicker"
import tsParser from "@typescript-eslint/parser"

export default [
    {
        files: ["src/**/*.ts", "src/**/*.tsx"],
        languageOptions: { parser: tsParser, ecmaVersion: "latest", sourceType: "module" },
        plugins: { nitpicker },
        rules: nitpicker.configs.recommended.rules,
    },
    { files: ["src/**/*.tsx"], ...nitpicker.configs.react },
    { files: ["app/**/*.ts", "start/**/*.ts"], ...nitpicker.configs.adonisjs },
]
```

## Configuring individual rules
Turn a rule off, promote it to an error, or exempt specific files, the same way as any ESLint rule. This repo dog-foods Nitpicker on itself, and its `eslint.config.js` is a working reference for per-file exemptions:
```js
export default [
    nitpicker.configs.recommended,
    {
        files: ["src/lib/constants.ts"],
        rules: { "nitpicker/no-em-dash": "off" },
    },
]
```
