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
| `no-line-comment-period` | `//` comments carry no periods | inline-comment-style, BE/FE STYLE.md |
| `no-single-line-jsdoc` | JSDoc must span multiple lines | FE STYLE.md |
| `no-jsdoc-blank-before-tags` | No blank line before `@param`/`@returns` | jsdoc-style |
| `require-function-jsdoc` | JSDoc on top-level functions (React components exempt) | code-style, BE STYLE.md |
| `no-decorative-comment-separators` | No banner/box-drawing/`--` separators in comments (AdonisJS route files exempt via `allowIn`) | both STYLE.md |
| `require-framework-config` | Warn when a file uses a framework whose Nitpicker config isn't enabled | plugin meta-rule |
| `no-property-access-alias` | No `const` that just holds one property access (strict; `let`/exports exempt) | BE STYLE.md, gitgame code-style |
| `no-british-english` | No British spellings in identifiers/comments; `extra`/`ignore` options + comment autofix | user request |
| `max-jsdoc-description-length` | Cap JSDoc description prose (default 250 chars); fix flags usage-note anti-pattern | user request |

---

## Candidate — Comments & JSDoc

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
| `no-comment-semicolons` | Never write `;` inside any comment | E | All | Both STYLE.md "Forbidden Comment Patterns" |
| `comment-code-ref-quoting` | Code refs use backticks in JSDoc, double quotes in `//` (flag backticks in `//`) | M | All | Both STYLE.md "Code References" |
| `no-inline-block-comments` | Inline comments use `//`, never `/* */` | E | BE | BE STYLE.md "Inline Comments" |
| `jsdoc-no-mid-sentence-period` | JSDoc body links clauses with commas; end period OK, mid-sentence periods flagged | M | All | jsdoc-style, BE "Multi-Sentence Paragraphs" |
| `require-declaration-jsdoc` | JSDoc on **all** top-level decls (`const`/`type`/`interface`/`enum`), React components + `XProps` exempt | M | All | code-style (extends `require-function-jsdoc`) |
| `jsdoc-param-descriptions` | Every `@param`/`@returns` has a description (not a bare type); `@param` for every param, `@returns` for non-void | H | All | BE STYLE.md "Private Methods" |
| `jsdoc-returns-not-return` | Use `@returns`, never `@return` | E | All | BE STYLE.md |
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
| `no-alias-variables` | Ban a local whose sole purpose is to rename another variable | M | All | BE STYLE.md |
| `no-body-destructuring` | No object destructuring in variable declarations; allow call/hook returns, params, snake→camel rename | M | All | gitgame `no-destructuring` — **conflicts** with web-app (which allows rename); needs options |
| `no-redundant-union-cast` | Ban `let x: T \| null = expr as T` | M | BE | BE STYLE.md |
| `no-explicit-void-return` | Don't annotate `void`/`Promise<void>` when the body never returns | M | All | code-style |

## Candidate — Formatting / code breathing

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
| `code-breathing` | Blank line between logical blocks (`if`/`for`/`while`/`try`/decl groups) and before `return` (unless single-line body) | H | All | Both STYLE.md + code-style; flagship nitpicker rule, needs options |

## Candidate — Structure / organization

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
| `no-functions-in-component-files` | Component files contain only components; helpers go to `lib/`/`lib/utils/` | M | FE | gitgame + FE STYLE.md |
| `function-declaration-order` | Bottom-up ordering: helpers above callers, declared before used | H | All | gitgame `function-declaration-order` |
| `component-locals-usememo` | Inline trivial boolean predicates; wrap other derived values in `useMemo` | H | FE | gitgame `component-locals-style`; opinionated |

## Candidate — Project-specific (lower priority)

| Proposed rule | Enforces | Diff | Scope | Source / notes |
|---|---|---|---|---|
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
