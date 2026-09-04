import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-member-jsdoc-blank-line"

describe("require-member-jsdoc-blank-line", () => {
    test("It should report a documented member flush against the one above", ({ expect }) => {
        const code =
            "interface P {\n    allow?: boolean\n    /**\n     * Only strict providers.\n     */\n    strict?: boolean\n}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-member-jsdoc-blank-line")
        expect(messages[0]?.messageId).toBe("blankLine")
    })

    test("It should not report a documented member with a blank line above", ({ expect }) => {
        const code =
            "interface P {\n    allow?: boolean\n\n    /**\n     * Only strict providers.\n     */\n    strict?: boolean\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report the first member of the block", ({ expect }) => {
        const code =
            "interface P {\n    /**\n     * The first one.\n     */\n    allow?: boolean\n    strict?: boolean\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report an undocumented member", ({ expect }) => {
        expect(lintRule(RULE, "interface P {\n    allow?: boolean\n    strict?: boolean\n}")).toHaveLength(0)
    })

    test("It should report each offending member separately", ({ expect }) => {
        const code = [
            "interface P {",
            "    a: string",
            "    /**",
            "     * The b.",
            "     */",
            "    b: string",
            "    /**",
            "     * The c.",
            "     */",
            "    c: string",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(2)
    })

    test("It should apply to a type literal too", ({ expect }) => {
        const code = "type P = {\n    allow?: boolean\n    /**\n     * Strict.\n     */\n    strict?: boolean\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should apply to a method signature", ({ expect }) => {
        const code = "interface P {\n    a: string\n    /**\n     * Runs it.\n     */\n    run(): void\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a single-member interface", ({ expect }) => {
        expect(lintRule(RULE, "interface P {\n    /**\n     * Only.\n     */\n    a: string\n}")).toHaveLength(0)
    })

    test("It should insert the blank line, keeping the indentation", ({ expect }) => {
        const code = "interface P {\n    allow?: boolean\n    /**\n     * Strict.\n     */\n    strict?: boolean\n}"
        const output = fixRule(RULE, code)
        expect(output).toBe(
            "interface P {\n    allow?: boolean\n\n    /**\n     * Strict.\n     */\n    strict?: boolean\n}",
        )
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const code = "interface P {\n    a: string\n    /**\n     * The b.\n     */\n    b: string\n}"
        const messages = lintRule(RULE, code)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
