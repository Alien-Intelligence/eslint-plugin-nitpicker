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

## Shipped
| Rule                               | Enforces                                                                                                                                                                                           | Source                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| `no-em-dash`                       | No em dash character anywhere                                                                                                                                                                      | code-style, both STYLE.md                     |
| `no-emojis`                        | No emoji anywhere (comments/strings/identifiers); flag pairs, skin-tone and ZWJ sequences counted as one unit; `allow` option, report-only                                                         | user request                                  |
| `no-line-comment-period`           | `//` comments carry no periods; code dots, quoted spans, ellipses and abbreviations exempt; a closing period is removed, a mid-comment one is report-only                                          | inline-comment-style, BE/FE STYLE.md          |
| `no-line-comment-backticks`        | Code refs in `//` comments use double quotes, not backticks; autofix re-quotes them (fences, unpaired, directives and spans already holding a `"` exempt)                                          | user request; Both STYLE.md "Code References" |
| `require-capitalized-comments`     | Comments start with an uppercase letter; wrapped `//` continuations, directives, and comments opening with code/symbol/URL are exempt; autofix capitalizes                                         | user request                                  |
| `no-single-line-jsdoc`             | JSDoc must span multiple lines                                                                                                                                                                     | FE STYLE.md                                   |
| `no-jsdoc-blank-before-tags`       | No blank line before `@param`/`@returns`                                                                                                                                                           | jsdoc-style                                   |
| `require-function-jsdoc`           | JSDoc on functions: top-level always, plus class methods and nested ones by default (`include`/`ignore` options); React components exempt                                                          | code-style, BE STYLE.md                       |
| `no-decorative-comment-separators` | No banner/box-drawing/`--` separators in comments (AdonisJS route files exempt via `allowIn`)                                                                                                      | both STYLE.md                                 |
| `require-framework-config`         | Warn when a file uses a framework whose Nitpicker config isn't enabled                                                                                                                             | plugin meta-rule                              |
| `no-property-access-alias`         | No `const` that just holds one property access (strict; `let`/exports exempt)                                                                                                                      | BE STYLE.md, gitgame code-style               |
| `no-british-english`               | No British spellings in identifiers/comments; `extra`/`ignore` options + comment autofix                                                                                                           | user request                                  |
| `max-jsdoc-description-length`     | Cap JSDoc description prose (default 250 chars); fix flags usage-note anti-pattern                                                                                                                 | user request                                  |
| `no-alias-variables`               | No `const x = y` pure rename (`let`/exports exempt)                                                                                                                                                | BE STYLE.md                                   |
| `require-multiline-object`         | Object literal with more than N properties (default 2) must span multiple lines; autofix expands it one-per-line (skipped when the object holds a comment)                                         | user request                                  |
| `no-property-destructuring`        | No shorthand destructure off a plain object (`const { a } = obj`); calls/renames/defaults/rest exempt                                                                                              | gitgame convention, user request              |
| `no-jsdoc-returns-on-void`         | No `@returns` tag on a function that returns nothing (void type, or a body with no/only-bare `return`); autofix removes the tag                                                                    | user request                                  |
| `require-migration-jsdoc`          | Require a JSDoc above an AdonisJS migration class (adonisjs category)                                                                                                                              | user request, web-app migrations              |
| `migration-table-order`            | Table-builder statements grouped columns → timestamps → indexes/constraints (adonisjs category)                                                                                                    | user request, web-app migrations              |
| `require-controller-jsdoc`         | Require a JSDoc above an AdonisJS controller (default-exported `*Controller` class) (adonisjs category)                                                                                            | user request                                  |
| `require-hook-object-return`       | Custom `use*` hook must return an object, not a bare function; autofix wraps a returned identifier (react category)                                                                                | user request                                  |
| `require-context-hook-destructure` | Result of a `use*Context` consumer hook must be destructured, not bound whole (react category)                                                                                                     | user request                                  |
| `no-jsx-comments`                  | No inline `{/* ... */}` comments in JSX; extract a named sub-component (react category)                                                                                                            | user request                                  |
| `require-memo-callback-jsdoc`      | JSDoc required on `useMemo`/`useCallback`; `@param` per `useCallback` parameter (react category)                                                                                                   | user request                                  |
| `require-derived-usememo`          | A component/hook `const` derived via a non-hook call must be a `useMemo` (react category)                                                                                                          | user request                                  |
| `no-relative-imports`              | No relative (`./`, `../`) import/re-export paths; use the package alias (`allowIn` globs exempt)                                                                                                   | web-app pass; both STYLE.md                   |
| `require-validated-request`        | Controllers read request data via `request.validateUsing()`, not raw `request.input/body/qs/all` (`allowIn` globs exempt) (adonisjs category)                                                      | web-app pass; BE STYLE.md                     |
| `catch-error-name`                 | A `catch` clause binds its error as `error` (`_error` for an unused binding)                                                                                                                       | web-app pass; BE STYLE.md                     |
| `max-classname-length`             | Flag a `className` class string over a max length (default 120); break it up, e.g. via `cn()` (react category)                                                                                     | user request                                  |
| `require-complete-jsdoc`           | A function that has a JSDoc must document every parameter (@param) and its return (@returns); void/Promise<void> and JSX components need no @returns; destructured params accept either convention | user request                                  |
| `require-jsdoc-delimiter-lines`    | A JSDoc's `/**` and `*/` sit on their own lines, never sharing one with prose; autofix moves the text                                                                                              | user request                                  |
| `max-line-comment-length`          | A run of consecutive `//` comments is capped at N characters of prose (default 200, tighter than the JSDoc cap)                                                                                    | user request                                  |
| `require-consistent-member-jsdoc`  | Once any member of an interface or type literal is documented, all of them must be; documenting none stays fine                                                                                    | user request                                  |
| `require-member-jsdoc-blank-line`  | A documented interface or type-literal member needs a blank line above it (the first needs none); autofix inserts it                                                                               | user request                                  |
| `require-blank-before-block`       | A multi-line control-flow block that follows another statement needs a blank line above it; autofix inserts it (`breathing` config)                                                                | user request; both STYLE.md "Code Breathing"  |
| `require-blank-before-return`      | The `return`/`throw` a block of N+ statements ends on needs a blank line above it (default 4, counting the exit); autofix inserts it (`breathing` config)                                          | user request; both STYLE.md "Code Breathing"  |
| `max-consecutive-statements`       | A run of sibling statements with no blank line between them is capped at N (default 4); report-only, since no fix can pick the break point (`breathing` config)                                    | user request; both STYLE.md "Code Breathing"  |

## Candidate — Comments & JSDoc
| Proposed rule                        | Enforces                                                                                                                                                 | Diff | Scope | Source / notes                                    |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|------|-------|---------------------------------------------------|
| `no-comment-semicolons`              | Never write `;` inside any comment                                                                                                                       | E    | All   | Both STYLE.md "Forbidden Comment Patterns"        |
| `require-jsdoc-code-ref-backticks`   | The JSDoc half of the shipped `no-line-comment-backticks`: a code ref in a JSDoc body is fenced in backticks (needs a way to tell a code ref from prose) | H    | All   | Both STYLE.md "Code References"                   |
| `no-inline-block-comments`           | Inline comments use `//`, never `/* */`                                                                                                                  | E    | BE    | BE STYLE.md "Inline Comments"                     |
| `jsdoc-no-mid-sentence-period`       | JSDoc body links clauses with commas; end period OK, mid-sentence periods flagged                                                                        | M    | All   | jsdoc-style, BE "Multi-Sentence Paragraphs"       |
| `require-declaration-jsdoc`          | JSDoc on **all** top-level decls (`const`/`type`/`interface`/`enum`), React components + `XProps` exempt                                                 | M    | All   | code-style (extends `require-function-jsdoc`)     |
| `jsdoc-param-descriptions`           | Every `@param`/`@returns` has a description (not a bare type); `@param` for every param, `@returns` for non-void                                         | H    | All   | BE STYLE.md "Private Methods"                     |
| `jsdoc-returns-not-return`           | Use `@returns`, never `@return`                                                                                                                          | E    | All   | BE STYLE.md; next up, can reuse `getJSDocLineTag` |
| `jsdoc-boolean-returns-capital-true` | A boolean `@returns` description starts with `True…` (no backticks), e.g. "True if the class is a migration"                                             | E    | All   | user request; dog-food convention                 |
| `no-convention-exception-preamble`   | No top-of-file blocks restating a convention / "See STYLE.md …"                                                                                          | M    | All   | web-app memory                                    |

## Candidate — Naming
| Proposed rule                      | Enforces                                                                        | Diff | Scope | Source / notes                                                 |
|------------------------------------|---------------------------------------------------------------------------------|------|-------|----------------------------------------------------------------|
| `boolean-is-are-prefix`            | Booleans (locals, params, props) prefixed `is`/`are`                            | H    | All   | code-style + BE STYLE.md; type-aware for accuracy              |
| `no-snake-case-identifiers`        | Identifiers camelCase, not snake_case (allow destructure-rename + route tokens) | M    | All   | BE STYLE.md; overlaps core `camelcase` but with our exceptions |
| `private-member-underscore-prefix` | Private class members use `_` prefix                                            | M    | BE    | BE STYLE.md "hard rule"                                        |
| `enum-screaming-snake-keys`        | Enum keys `SCREAMING_SNAKE_CASE`, lowercase string values                       | M    | BE    | BE STYLE.md                                                    |

## Candidate — Variables & anti-patterns (the "useless aliases" family)
| Proposed rule             | Enforces                                                          | Diff | Scope | Source / notes |
|---------------------------|-------------------------------------------------------------------|------|-------|----------------|
| `no-redundant-union-cast` | Ban `let x: T \| null = expr as T`                                | M    | BE    | BE STYLE.md    |
| `no-explicit-void-return` | Don't annotate `void`/`Promise<void>` when the body never returns | M    | All   | code-style     |

## Candidate — Formatting / code breathing
Shipped in 0.8.0 as three rules in the opt-in `breathing` config: `require-blank-before-block`, `require-blank-before-return`, and `max-consecutive-statements`. They are kept out of `recommended` because adopting them rewrites the whitespace of an existing codebase, and `categoryRules()` ignores `meta.docs.recommended`, so a `base` rule would land in every consumer's CI on upgrade.

Calibrated against two corpora (`chat-sdk`, packed; `data-streaming/web-app`, well spaced), which drove five exemptions: a declaration consumed by the statement below it, single-line guard clauses, formatter-wrapped unbraced guards, multi-line statements ending a run, and runs of parallel statements sharing a receiver (schema builders, assertion blocks, `useState` stacks). Final counts: chat-sdk 112 findings across 30/79 files, web-app 290 across 151/1694.

| Proposed rule           | Enforces                                                                                     | Diff | Scope | Source / notes                                          |
|-------------------------|------------------------------------------------------------------------------------------------|------|-------|----------------------------------------------------------|
| `blank-after-block`     | A statement following a multi-line block needs a blank line below the closing brace           | M    | All   | The "below" half; noisier (block-ends-container, `else`) |
| `blank-around-iife`     | A multi-line IIFE gets the same treatment as control flow (`blocks: ["expression"]` option)   | E    | All   | Known gap in `require-blank-before-block`                |
| `no-orphaned-comment`   | A comment separated from the code below it by a blank line is either attached or moved        | E    | All   | Surfaced while designing the breathing helpers           |

## Candidate — Structure / organization
| Proposed rule                     | Enforces                                                                                                                                                                                                                                      | Diff | Scope | Source / notes                                                         |
|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|-------|------------------------------------------------------------------------|
| `constants-in-constants-file`     | Top-level `SCREAMING_SNAKE_CASE` consts (actual constants) don't live at the root of a code file; move them to a `lib/constants.ts` (or `constants/`). Flag by declaration location; can't autofix the move, message points where to relocate | M    | All   | user request; mirrors this plugin's own `CONSTANTS` convention         |
| `helpers-in-lib`                  | Non-trivial module-level helper functions don't live in a "leaf" file (rule/route/component); extract to a `lib/`/`lib/utils/` module. Needs a size/complexity threshold so tiny local predicates stay put                                    | H    | All   | user request; mirrors this plugin's own `lib/utils/` convention        |
| `no-functions-in-component-files` | Component files contain only components; helpers go to `lib/`/`lib/utils/`                                                                                                                                                                    | M    | FE    | gitgame + FE STYLE.md                                                  |
| `function-declaration-order`      | Bottom-up ordering: helpers above callers, declared before used                                                                                                                                                                               | H    | All   | gitgame `function-declaration-order`                                   |
| `context-provider-value-object`   | A `<SomeContext.Provider value={…}>` value must be an object literal, not a bare function/value                                                                                                                                               | M    | FE    | user request; JSX-side sibling of shipped `require-hook-object-return` |

## Candidate — Project-specific (lower priority)
| Proposed rule                   | Enforces                                                                                                                      | Diff | Scope           | Source / notes                                          |
|---------------------------------|-------------------------------------------------------------------------------------------------------------------------------|------|-----------------|---------------------------------------------------------|
| `no-migration-section-comments` | No section-label comments (`// Timestamps`, `// Relationships`, …) inside a migration's table builder; keep genuine why-notes | M    | proj (AdonisJS) | web-app migrations; deferred (comments-scope undecided) |
| `anonymous-migration-class`     | Migration default-export class must be anonymous (flag `class BaselineMigration extends BaseSchema`)                          | E    | proj (AdonisJS) | web-app migrations; deferred                            |
| `migration-id-first`            | First `createTable` column must be `increments("id")`                                                                         | M    | proj (AdonisJS) | web-app migrations; deferred (table-dependent)          |
| `no-ctx-httpcontext-param`      | Controllers destructure `HttpContext`, never `ctx: HttpContext`                                                               | M    | proj (AdonisJS) | BE STYLE.md; middleware exempt                          |
| `no-optional-user-override`     | A route has one subject; no optional `params.user_id` override                                                                | H    | proj (AdonisJS) | BE STYLE.md                                             |
| `config-over-magic-numbers`     | Timing/threshold values live in `*_CONFIG`, not inline                                                                        | H    | BE              | BE STYLE.md                                             |
| `tailwind-canonical-classes`    | Prefer canonical Tailwind classes over arbitrary values                                                                       | H    | FE              | FE STYLE.md; overlaps existing tailwind plugins         |

## Candidate — React / frontend (0.7.0 web-app research pass)
| Proposed rule                       | Enforces                                                                                                           | Diff | Scope | Source / notes                                                        |
|-------------------------------------|--------------------------------------------------------------------------------------------------------------------|------|-------|-----------------------------------------------------------------------|
| `props-type-name-matches-component` | A default-exported component's props type is named `<Component>Props`, not a generic `Props`                       | M    | FE    | web-app pass; 518 `XProps` vs 0 generic                               |
| `no-inline-props-type`              | Component props reference a named type/interface, never an inline `({…}: { … })` literal                           | M    | FE    | web-app pass; 518 named vs 13 inline; pairs with props-type-name      |
| `event-handler-handle-prefix`       | A locally-declared fn bound to a JSX `on*` prop is named `handle*` (setter / `field.onChange` passthroughs exempt) | H    | FE    | web-app pass; 334 `handleX` handlers                                  |
| `require-tsx-default-export`        | A `.tsx` component file exports its component via `export default`                                                 | M    | FE    | web-app pass + FE STYLE.md; ~39 provider/hook files need an allowlist |
| `no-hand-rolled-spinner-skeleton`   | No `animate-spin`/`animate-pulse` in className; use the `<Spinner/>`/`<Skeleton/>` primitives                      | E    | FE    | web-app pass; FE STYLE.md "forbidden patterns"                        |
| `no-redundant-disabled-isloading`   | Forbid `<Button disabled={x} isLoading={x}>` with the same expression on both props                                | M    | FE    | web-app pass; FE STYLE.md                                             |

## Candidate — Framework structure (Next.js / AdonisJS) (0.7.0 web-app research pass)
| Proposed rule                      | Enforces                                                                                                                       | Diff | Scope     | Source / notes                                                                |
|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|------|-----------|-------------------------------------------------------------------------------|
| `require-use-server-in-queries`    | Every file under `queries/` starts with a `"use server"` directive                                                             | M    | proj (FE) | web-app pass; 36/36 comply; FE STYLE.md                                       |
| `require-use-client-in-hooks`      | Every hook file under `hooks/api/` starts with `"use client"`                                                                  | M    | proj (FE) | web-app pass; FE STYLE.md                                                     |
| `app-router-server-client-split`   | `page.tsx` is a Server Component (no `"use client"`); its sibling `content.tsx` starts with `"use client"`                     | M    | proj (FE) | web-app pass; 63/62, 1 exception                                              |
| `no-console-in-queries`            | No `console.warn`/`console.error` in `queries/`; use `tryCatchLog`                                                             | E    | proj (FE) | web-app pass; **docs conflict** — examples still use console, confirm intent  |
| `require-service-singleton-export` | A `services/` file exporting a service class also exports a camelCase singleton (`export const fooService = new FooService()`) | M    | proj (BE) | web-app pass; 26/26; not written in STYLE.md                                  |
| `controller-response-via-helper`   | Controllers respond via `this.successResponse<T>()`/`errorResponse()`, not raw `response.status/send/json`                     | M    | proj (BE) | web-app pass; 1495 helper calls; ~5 passthrough controllers need an allowlist |
| `require-success-response-generic` | `this.successResponse(...)` is always called with an explicit type argument                                                    | E    | proj (BE) | web-app pass; BE STYLE.md                                                     |
| `no-httpcontext-jsdoc-param`       | A route-handler JSDoc never carries `@param` for `HttpContext` or its destructured props (`auth`, `request`, `params`, …)      | M    | proj (BE) | web-app pass; BE STYLE.md; complements shipped `require-controller-jsdoc`     |
| `belongsto-fk-column-adjacent`     | Each `@belongsTo` relation is immediately preceded by its `@column() declare <rel>Id` foreign key                              | M    | proj (BE) | web-app pass; 73 `@belongsTo` across 39 models                                |

## Candidate — Logging (AdonisJS) (0.7.0 web-app research pass)
| Proposed rule                    | Enforces                                                                                       | Diff | Scope | Source / notes                                                                     |
|----------------------------------|------------------------------------------------------------------------------------------------|------|-------|------------------------------------------------------------------------------------|
| `trycatchlog-failed-to-prefix`   | The message arg to `tryCatchLog(...)` starts with `"failed to "`                               | E    | BE    | web-app pass; 179/199 comply; BE STYLE.md                                          |
| `logger-data-object-first`       | `logger.{info,warn,error,debug}` takes the structured data object first, message string second | M    | BE    | web-app pass; BE STYLE.md                                                          |
| `no-log-message-trailing-period` | Log message strings carry no trailing period                                                   | E    | BE    | web-app pass; BE STYLE.md; lowercase-initial variant needs a proper-noun allowlist |

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
- **Doc conflicts found in the 0.7.0 web-app pass** (confirm intent before building):
  `console.warn`/`console.error` are banned in `queries/` yet the STYLE.md's own examples still use them;
  and STYLE.md says "use `next/image` for all images" while CLAUDE.md says image optimization is disabled
  ("external CDN assumed"), so a `require-next-image` rule would contradict the architecture doc and was
  deliberately not proposed.
