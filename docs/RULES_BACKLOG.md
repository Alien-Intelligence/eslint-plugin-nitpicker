# Nitpicker rules backlog
The goal of this plugin is to **replace the `STYLE.md` and `CLAUDE.md` files** across our
projects: every lintable convention becomes a rule that both enforces the style and carries
AI-fixable context in its message, so agents no longer have to be re-told the rules.

This file tracks candidate rules mined from existing convention sources:
- `celk` / `gitgame` agent memory (`~/.claude/projects/.../memory/feedback_*.md`)
- `web-app` `packages/backend/STYLE.md` and `packages/frontend/STYLE.md`
- `web-app` agent memory

Difficulty: **E**asy (text/comment scan) · **M**edium (AST work) · **H**ard (type info / call graph / cross-file).
Scope: **All** · **BE** (backend/AdonisJS) · **FE** (frontend/React) · **proj** (project-specific).

---

## Shipped

| Rule | Enforces | Source |
|-------|---|---|
| `no-em-dash` | No em dash character anywhere | code-style, both STYLE.md |
| `no-emojis` | No emoji anywhere (comments/strings/identifiers); flags flags, skin-tone and ZWJ sequences as one unit; autofix removes them | user request |
| `no-line-comment-period` | `//` comments carry no periods; code dots, quoted spans, ellipses and abbreviations exempt; a closing period is removed, a mid-comment one splits onto its own line | inline-comment-style, BE/FE STYLE.md |
| `no-line-comment-backticks` | Code refs in `//` comments use double quotes, not backticks; autofix re-quotes them (fences, unpaired, directives and spans already holding a `"` exempt) | user request; Both STYLE.md "Code References" |
| `require-capitalized-comments` | Comments start with an uppercase letter; wrapped `//` continuations, directives, and comments opening with code/symbol/URL are exempt; autofix capitalizes | user request |
| `no-single-line-jsdoc` | JSDoc must span multiple lines | FE STYLE.md |
| `no-jsdoc-blank-before-tags` | No blank line before `@param`/`@returns` | jsdoc-style |
| `require-function-jsdoc` | JSDoc on top-level functions (React components exempt) | code-style, BE STYLE.md |
| `no-decorative-comment-separators` | No banner/box-drawing/`--` separators in comments (AdonisJS route files exempt via `allowIn`) | both STYLE.md |
| `require-framework-config` | Warn when a file uses a framework whose Nitpicker config isn't enabled | plugin meta-rule |
| `no-property-access-alias` | No `const` that just holds one property access (strict; `let`/exports exempt) | BE STYLE.md, gitgame code-style |
| `no-british-english` | No British spellings in identifiers/comments; `extra`/`ignore` options + comment autofix | user request |
| `max-jsdoc-description-length` | Cap JSDoc description prose (default 250 chars); fix flags usage-note anti-pattern | user request |
| `no-alias-variables` | No `const x = y` pure rename (`let`/exports exempt) | BE STYLE.md |
| `require-multiline-object` | Object literal with more than N properties (default 2) must span multiple lines; autofix expands it one-per-line | user request |
| `no-property-destructuring` | No shorthand destructure off a plain object (`const { a } = obj`); calls/renames/defaults/rest exempt | gitgame convention, user request |
| `no-jsdoc-returns-on-void` | No `@returns` tag on a function that returns nothing (void type, or a body with no/only-bare `return`); autofix removes the tag | user request |
| `require-migration-jsdoc` | Require a JSDoc above an AdonisJS migration class (adonisjs category) | user request, web-app migrations |
| `migration-table-order` | Table-builder statements grouped columns → timestamps → indexes/constraints (adonisjs category) | user request, web-app migrations |
| `require-controller-jsdoc` | Require a JSDoc above an AdonisJS controller (default-exported `*Controller` class) (adonisjs category) | user request |
| `require-hook-object-return` | Custom `use*` hook must return an object, not a bare function; autofix wraps a returned identifier (react category) | user request |
| `require-context-hook-destructure` | Result of a `use*Context` consumer hook must be destructured, not bound whole (react category) | user request |

---

## Candidate — Comments & JSDoc

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
| `no-comment-semicolons` | Never write `;` inside any comment | E | All | Both STYLE.md "Forbidden Comment Patterns" |
| `require-jsdoc-code-ref-backticks` | The JSDoc half of the shipped `no-line-comment-backticks`: a code ref in a JSDoc body is fenced in backticks (needs a way to tell a code ref from prose) | H | All | Both STYLE.md "Code References" |
| `no-inline-block-comments` | Inline comments use `//`, never `/* */` | E | BE | BE STYLE.md "Inline Comments" |
| `jsdoc-no-mid-sentence-period` | JSDoc body links clauses with commas; end period OK, mid-sentence periods flagged | M | All | jsdoc-style, BE "Multi-Sentence Paragraphs" |
| `require-declaration-jsdoc` | JSDoc on **all** top-level decls (`const`/`type`/`interface`/`enum`), React components + `XProps` exempt | M | All | code-style (extends `require-function-jsdoc`) |
| `jsdoc-param-descriptions` | Every `@param`/`@returns` has a description (not a bare type); `@param` for every param, `@returns` for non-void | H | All | BE STYLE.md "Private Methods" |
| `jsdoc-returns-not-return` | Use `@returns`, never `@return` | E | All | BE STYLE.md; next up — can reuse `getJSDocLineTag` |
| `jsdoc-boolean-returns-capital-true` | A boolean `@returns` description starts with `True…` (no backticks), e.g. "True if the class is a migration" | E | All | user request; dog-food convention |
| `no-section-comments-in-components` | No comments labeling JSX/logic sections; extract a sub-component instead | M | FE | FE STYLE.md |
| `no-convention-exception-preamble` | No top-of-file blocks restating a convention / "See STYLE.md …" | M | All | web-app memory |

## Candidate — Naming

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
| `boolean-is-are-prefix` | Booleans (locals, params, props) prefixed `is`/`are` | H | All | code-style + BE STYLE.md; type-aware for accuracy |
| `no-snake-case-identifiers` | Identifiers camelCase, not snake_case (allow destructure-rename + route tokens) | M | All | BE STYLE.md; overlaps core `camelcase` but with our exceptions |
| `private-member-underscore-prefix` | Private class members use `_` prefix | M | BE | BE STYLE.md "hard rule" |
| `enum-screaming-snake-keys` | Enum keys `SCREAMING_SNAKE_CASE`, lowercase string values | M | BE | BE STYLE.md |

## Candidate — Variables & anti-patterns (the "useless aliases" family)

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
| `no-redundant-union-cast` | Ban `let x: T \| null = expr as T` | M | BE | BE STYLE.md |
| `no-explicit-void-return` | Don't annotate `void`/`Promise<void>` when the body never returns | M | All | code-style |

## Candidate — Formatting / code breathing

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
| `code-breathing` | Blank line between logical blocks (`if`/`for`/`while`/`try`/decl groups) and before `return` (unless single-line body) | H | All | Both STYLE.md + code-style; flagship nitpicker rule, needs options |

## Candidate — Structure / organization

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
| `constants-in-constants-file` | Top-level `SCREAMING_SNAKE_CASE` consts (actual constants) don't live at the root of a code file; move them to a `lib/constants.ts` (or `constants/`). Flag by declaration location; can't autofix the move, message points where to relocate | M | All | user request; mirrors this plugin's own `CONSTANTS` convention |
| `helpers-in-lib` | Non-trivial module-level helper functions don't live in a "leaf" file (rule/route/component); extract to a `lib/`/`lib/utils/` module. Needs a size/complexity threshold so tiny local predicates stay put | H | All | user request; mirrors this plugin's own `lib/utils/` convention |
| `no-functions-in-component-files` | Component files contain only components; helpers go to `lib/`/`lib/utils/` | M | FE | gitgame + FE STYLE.md |
| `function-declaration-order` | Bottom-up ordering: helpers above callers, declared before used | H | All | gitgame `function-declaration-order` |
| `component-locals-usememo` | Inline trivial boolean predicates; wrap other derived values in `useMemo` | H | FE | gitgame `component-locals-style`; opinionated |
| `context-provider-value-object` | A `<SomeContext.Provider value={…}>` value must be an object literal, not a bare function/value | M | FE | user request; JSX-side sibling of shipped `require-hook-object-return` |

## Candidate — Project-specific (lower priority)

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
| `no-migration-section-comments` | No section-label comments (`// Timestamps`, `// Relationships`, …) inside a migration's table builder; keep genuine why-notes | M | proj (AdonisJS) | web-app migrations; deferred (comments-scope undecided) |
| `anonymous-migration-class` | Migration default-export class must be anonymous (flag `class BaselineMigration extends BaseSchema`) | E | proj (AdonisJS) | web-app migrations; deferred |
| `migration-id-first` | First `createTable` column must be `increments("id")` | M | proj (AdonisJS) | web-app migrations; deferred (table-dependent) |
| `no-ctx-httpcontext-param` | Controllers destructure `HttpContext`, never `ctx: HttpContext` | M | proj (AdonisJS) | BE STYLE.md; middleware exempt |
| `no-optional-user-override` | A route has one subject; no optional `params.user_id` override | H | proj (AdonisJS) | BE STYLE.md |
| `config-over-magic-numbers` | Timing/threshold values live in `*_CONFIG`, not inline | H | BE | BE STYLE.md |
| `tailwind-canonical-classes` | Prefer canonical Tailwind classes over arbitrary values | H | FE | FE STYLE.md; overlaps existing tailwind plugins |

---

## Cross-cutting notes

- **Conflicts need options.** `no-body-destructuring` is absolute in gitgame but relaxed in web-app
  (rename-on-destructure allowed). Rules mined from multiple projects should ship with options and
  per-project config, not a single hard-coded behavior.
- **`require-function-jsdoc` → `require-declaration-jsdoc`.** The shipped rule only covers functions;
  the conventions want JSDoc on every top-level declaration. Either broaden the existing rule (with an
  option) or add a sibling rule sharing the React-component exemption helper.
- **File-naming conventions** (`snake_case` controllers, `{entity}_validator.ts`, etc.) are in the
  STYLE.md but are not AST-lintable in the usual way; would need a filename-pattern rule. Deferred.
- **Type-aware rules** (`boolean-is-are-prefix`, `jsdoc-param-descriptions`) are most accurate with the
  TypeScript type checker; decide whether Nitpicker takes a type-aware tier or stays syntactic.
