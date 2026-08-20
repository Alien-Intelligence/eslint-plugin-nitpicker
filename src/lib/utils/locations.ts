import type { TSESLint } from "@typescript-eslint/utils"

/**
 * A place a flagged character may be tolerated, so user-facing copy, prompt
 * text, and glyphs can keep it while code and comments stay clean.
 */
export type SourceLocation = "strings" | "templates" | "jsx" | "comments"

/**
 * The token type each location maps to, `comments` aside, as comments are not
 * tokens.
 */
const TOKEN_TYPES: Partial<Record<SourceLocation, string>> = {
    strings: "String",
    templates: "Template",
    jsx: "JSXText",
}

/**
 * Collects the source ranges covered by the given locations (string, template,
 * and JSX tokens, plus comments), so a raw-text scan can skip characters that
 * sit in copy the caller has chosen to allow.
 * @param sourceCode The source code of the linted file.
 * @param allow The locations to exempt.
 * @returns The exempt `[start, end]` ranges, empty when nothing is allowed.
 */
export function allowedRanges(
    sourceCode: Readonly<TSESLint.SourceCode>,
    allow: Iterable<SourceLocation>,
): [number, number][] {
    const locations = new Set(allow)
    const ranges: [number, number][] = []
    if (locations.size === 0) return ranges

    const tokenTypes = new Set([...locations].map(location => TOKEN_TYPES[location]).filter(type => type !== undefined))

    for (const token of sourceCode.ast.tokens ?? []) {
        if (tokenTypes.has(token.type)) ranges.push(token.range)
    }

    if (locations.has("comments")) {
        for (const comment of sourceCode.getAllComments()) {
            ranges.push(comment.range)
        }
    }

    return ranges
}

/**
 * Checks whether an index falls inside any of the given ranges.
 * @param index The source index to test.
 * @param ranges The `[start, end]` ranges to check against.
 * @returns True if the index sits within a range.
 */
export function isInAnyRange(index: number, ranges: [number, number][]): boolean {
    return ranges.some(([start, end]) => index >= start && index < end)
}
