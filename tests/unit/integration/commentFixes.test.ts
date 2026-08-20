import * as tsParser from "@typescript-eslint/parser"
import type { ESLint, Linter as ESLinter } from "eslint"
import { Linter } from "eslint"
import { describe, test } from "vitest"
import plugin from "@/index"
import CONSTANTS from "@/lib/constants"

// The comment rules all rewrite the same text, so their fixes are exercised
// together here, single-rule coverage cannot catch them corrupting each other
const RULES = [
    "no-line-comment-backticks",
    "no-line-comment-period",
    "require-capitalized-comments",
    "no-british-english",
]

/**
 * Fixes a snippet with every comment rule enabled at once.
 * @param code The source code to lint and fix.
 * @returns The source code after applying every rule's fixes.
 */
function fixComments(code: string): string {
    const rules: ESLinter.Config["rules"] = {}
    for (const rule of RULES) rules[`${CONSTANTS.PLUGIN_NAME}/${rule}`] = "error"

    const config: ESLinter.Config[] = [
        {
            files: ["**/*.ts"],
            languageOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                parser: tsParser as unknown as ESLinter.Parser,
            },
            plugins: { [CONSTANTS.PLUGIN_NAME]: plugin as unknown as ESLint.Plugin },
            rules,
        },
    ]

    return new Linter().verifyAndFix(code, config, "file.ts").output
}

describe("comment fixes together", () => {
    test("It should rewrite a back-ticked reference and drop the closing period", ({ expect }) => {
        expect(fixComments("// Reads `auth.user` from the context.")).toBe('// Reads "auth.user" from the context')
    })

    test("It should keep shielding dots once a span becomes double-quoted", ({ expect }) => {
        expect(fixComments("// Calls `foo.bar` and `a. b` here")).toBe('// Calls "foo.bar" and "a. b" here')
    })

    test("It should capitalize a run-on but leave the mid-comment period (report-only)", ({ expect }) => {
        expect(fixComments("// reads the token. It is cached")).toBe("// Reads the token. It is cached")
    })

    test("It should leave a quoted period alone", ({ expect }) => {
        expect(fixComments('// Cannot start with "." or "-"')).toBe('// Cannot start with "." or "-"')
    })

    test("It should leave an abbreviation and a code glob alone", ({ expect }) => {
        expect(fixComments("// Emits subagent.* events, e.g. on start")).toBe(
            "// Emits subagent.* events, e.g. on start",
        )
    })

    test("It should correct a spelling inside a converted span", ({ expect }) => {
        expect(fixComments("// Uses `normalise` here.")).toBe('// Uses "normalize" here')
    })

    test("It should converge on a comment needing every fix at once", ({ expect }) => {
        // Backticks -> quotes, spellings fixed, first letter capitalized, terminal
        // period removed; the mid-comment period is report-only, so it stays
        const output = fixComments("// normalise `foo.bar`. then it colours the cell.")
        expect(output).toBe('// Normalize "foo.bar". then it colors the cell')
    })
})
