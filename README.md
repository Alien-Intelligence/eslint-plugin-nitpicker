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
Nitpicker ships five shared flat configs:
| Config        | What it enables                                                                            |
|---------------|--------------------------------------------------------------------------------------------|
| `recommended` | The universal `base` ruleset, every rule enabled as a warning. The sensible default.       |
| `base`        | The same universal rules, with no framework assumptions.                                   |
| `all`         | Every rule, plus both framework rulesets opted in. The maximally pedantic setup.           |
| `react`       | Opts into the React ruleset for the files you scope it to.                                 |
| `adonisjs`    | Opts into the AdonisJS ruleset, and relaxes decorative separators in `start/routes` files. |

## Rules
Every rule is part of `recommended` and enabled as a warning. The Fixable column marks rules that `eslint --fix` can resolve automatically:
| Rule                                         | Fixable | Description                                                                                      |
|----------------------------------------------|---------|--------------------------------------------------------------------------------------------------|
| `nitpicker/max-jsdoc-description-length`     |         | Enforce a maximum character length for a JSDoc description (default 250).                        |
| `nitpicker/no-british-english`               | yes     | Disallow British spellings in identifiers and comments, reporting the American equivalent.       |
| `nitpicker/no-decorative-comment-separators` |         | Disallow decorative separators (banners, box-drawing, repeated dashes) inside comments.          |
| `nitpicker/no-em-dash`                       |         | Disallow the em dash character anywhere in the source.                                           |
| `nitpicker/no-jsdoc-blank-before-tags`       | yes     | Disallow blank lines before JSDoc tags such as `@param` or `@returns`.                           |
| `nitpicker/no-line-comment-backticks`        | yes     | Disallow backticks in `//` line comments, rewriting code references with double quotes.           |
| `nitpicker/no-line-comment-period`           | yes     | Disallow prose periods in `//` line comments (code dots, quoted spans, ellipses, `e.g.` are OK). |
| `nitpicker/no-property-access-alias`         |         | Disallow a `const` whose whole value is a single property access; inline the expression instead. |
| `nitpicker/no-single-line-jsdoc`             | yes     | Require JSDoc comments to span multiple lines rather than a single line.                         |
| `nitpicker/require-framework-config`         |         | Warn when a file uses a framework whose Nitpicker config is not enabled.                         |
| `nitpicker/require-function-jsdoc`           |         | Require a JSDoc comment on top-level functions (React component functions are exempt).           |

### Rule options
A few rules accept options. Pass them by overriding the rule with a `["warn", { ... }]` tuple.

`max-jsdoc-description-length` takes `{ max: number }`, defaulting to `250`:
```js
"nitpicker/max-jsdoc-description-length": ["warn", { max: 200 }],
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

### Line comment code references
A backtick renders as code inside a JSDoc block, but in a `//` comment it is just a literal character, so `no-line-comment-backticks` rewrites those references with double quotes:
```js
// Reads `auth.user` from the context  ->  // Reads "auth.user" from the context
```
Backticks are left alone in JSDoc and block comments, in tooling directives, when unpaired, in a run (a ```` ``` ```` fence), and when the span already holds a double quote, since `` `split(".")` `` cannot be requoted without nesting.

### Line comment periods
`no-line-comment-period` only treats a dot as prose when whitespace or the end of the comment follows it, so dots inside code (`foo.bar`, `subagent.*`, `split(".")`), inside a quoted or back-ticked span, in an ellipsis, or closing an abbreviation (`e.g.`, `i.e.`, `etc.`) are left alone.

The two prose cases are fixed differently, since removing a period is only safe at the end of a comment:
```js
// Reads the token.                     ->  // Reads the token
// Reads the token. It is cached        ->  // Reads the token
                                        //  // It is cached
const a = 1 // Reads the token. Cached  ->  reported, not fixed
```
A mid-comment period is split onto its own line rather than deleted, which would leave a run-on. A trailing comment is reported without a fix, as splitting it would break the line it sits on.

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
