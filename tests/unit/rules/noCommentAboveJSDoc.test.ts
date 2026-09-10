import { lintRule } from "tests/utils/lint"
import { describe, expect, test } from "vitest"

const RULE = "no-comment-above-jsdoc"

/**
 * Joins source lines, so a fixture reads as the file it stands for.
 * @param lines The source lines.
 * @returns The joined source.
 */
function source(...lines: string[]): string {
    return lines.join("\n")
}

const DOC = ["/**", " * Runs the thing.", " */", "function run() {}"]

describe("no-comment-above-jsdoc", () => {
    test("It should report a line comment stacked on a JSDoc", ({ expect }) => {
        const messages = lintRule(RULE, source("const a = 1", "", "// Why it works this way", ...DOC))

        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-comment-above-jsdoc")
        expect(messages[0]?.messageId).toBe("stacked")
    })

    test("It should report a multi-line run and span all of it", ({ expect }) => {
        const code = source("const a = 1", "", "// First line of rationale", "// Second line of rationale", ...DOC)
        const messages = lintRule(RULE, code)

        expect(messages).toHaveLength(1)
        expect(messages[0]?.line).toBe(3)
        expect(messages[0]?.endLine).toBe(4)
    })

    test("It should report a non-JSDoc block comment stacked on a JSDoc", ({ expect }) => {
        // Switching comment style must not be a way around the rule
        expect(lintRule(RULE, source("const a = 1", "", "/* Rationale */", ...DOC))).toHaveLength(1)
    })

    test("It should report each stacked comment separately", ({ expect }) => {
        const code = source(
            "const a = 1",
            "",
            "// First",
            "/**",
            " * One.",
            " */",
            "function one() {}",
            "",
            "// Second",
            "/**",
            " * Two.",
            " */",
            "function two() {}",
        )
        expect(lintRule(RULE, code)).toHaveLength(2)
    })

    test("It should report a comment stacked on a documented class", ({ expect }) => {
        const code = source(
            "const a = 1",
            "",
            "// Keyed on the symbol, not the package",
            "/**",
            " * Flags it.",
            " */",
            "class Thing {}",
        )
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a comment separated by a blank line", ({ expect }) => {
        expect(lintRule(RULE, source("const a = 1", "", "// Standalone note", "", ...DOC))).toHaveLength(0)
    })

    test("It should not report a JSDoc with nothing above it", ({ expect }) => {
        expect(lintRule(RULE, source("const a = 1", "", ...DOC))).toHaveLength(0)
    })

    test("It should not report a comment below the JSDoc", ({ expect }) => {
        const code = source("/**", " * Runs the thing.", " */", "// A note between doc and code", "function run() {}")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test.each([
        "// eslint-disable-next-line no-console",
        "// biome-ignore lint/suspicious/noExplicitAny: needed",
        "// @ts-expect-error legacy shape",
        "// #region Helpers",
    ])("It should not report the directive %s", directive => {
        // Filtered, since ESLint reports its own unused-directive warnings here
        const code = source("const a = 1", "", directive, ...DOC)
        const messages = lintRule(RULE, code).filter(message => message.ruleId === "nitpicker/no-comment-above-jsdoc")

        expect(messages).toHaveLength(0)
    })

    test("It should not report a file header on the first line", ({ expect }) => {
        // A banner at the very top documents the file, not the declaration
        expect(lintRule(RULE, source("// Copyright 2026 Alien Intelligence", ...DOC))).toHaveLength(0)
    })

    test("It should not report a trailing comment on the line above", ({ expect }) => {
        // The comment belongs to the code beside it, not to the JSDoc below
        expect(lintRule(RULE, source("const a = 1 // Inline note", ...DOC))).toHaveLength(0)
    })

    test("It should not report two stacked JSDoc blocks", ({ expect }) => {
        const code = source("/**", " * One.", " */", "/**", " * Two.", " */", "function run() {}")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a comment above a plain declaration", ({ expect }) => {
        expect(lintRule(RULE, source("// Just a note", "const a = 1"))).toHaveLength(0)
    })

    test("It should report a comment stacked on an interface member's JSDoc", ({ expect }) => {
        const code = source(
            "interface P {",
            "    a: string",
            "",
            "    // Rationale",
            "    /**",
            "     * The b.",
            "     */",
            "    b: string",
            "}",
        )
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should stop the run at a directive above the prose", ({ expect }) => {
        // The prose is still stacked, so it is still reported, but the run
        // starts below the directive rather than swallowing it
        const code = source("const a = 1", "", "// biome-ignore lint/style/noVar: legacy", "// Rationale", ...DOC)
        const messages = lintRule(RULE, code)

        expect(messages).toHaveLength(1)
        expect(messages[0]?.line).toBe(4)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, source("const a = 1", "", "// Rationale", ...DOC))
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
