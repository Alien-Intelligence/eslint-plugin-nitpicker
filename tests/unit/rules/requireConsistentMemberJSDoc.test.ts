import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-consistent-member-jsdoc"

describe("require-consistent-member-jsdoc", () => {
    test("It should not report an interface with no documented member", ({ expect }) => {
        expect(lintRule(RULE, "interface P {\n    a: string\n    b: number\n}")).toHaveLength(0)
    })

    test("It should not report an interface with every member documented", ({ expect }) => {
        const code = [
            "interface P {",
            "    /**",
            "     * The a.",
            "     */",
            "    a: string",
            "",
            "    /**",
            "     * The b.",
            "     */",
            "    b: number",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report the bare members when one is documented", ({ expect }) => {
        const code = [
            "interface StoredTurn {",
            "    sessionId: string",
            "    turnId: string",
            "    /**",
            "     * Reasoning text, display only.",
            "     */",
            "    thinking?: string",
            "    status: string",
            "}",
        ].join("\n")
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(3)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-consistent-member-jsdoc")
        expect(messages[0]?.messageId).toBe("inconsistent")
    })

    test("It should report only the bare members, not the documented one", ({ expect }) => {
        const code = "interface P {\n    a: string\n    /**\n     * The b.\n     */\n    b: number\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should apply to a type literal too", ({ expect }) => {
        const code = "type P = {\n    a: string\n    /**\n     * The b.\n     */\n    b: number\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a single-member interface", ({ expect }) => {
        expect(lintRule(RULE, "interface P {\n    /**\n     * Only.\n     */\n    a: string\n}")).toHaveLength(0)
    })

    test("It should not report an empty interface", ({ expect }) => {
        expect(lintRule(RULE, "interface P {}")).toHaveLength(0)
    })

    test("It should treat a method signature as a member", ({ expect }) => {
        const code = "interface P {\n    /**\n     * Runs it.\n     */\n    run(): void\n    stop(): void\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should judge a nested type literal on its own members", ({ expect }) => {
        // The outer block is fully documented; the inner one documents none, so both are consistent
        const code = [
            "interface P {",
            "    /**",
            "     * The nested bag.",
            "     */",
            "    nested: { a: string; b: number }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should count a member documented above an ignore directive", ({ expect }) => {
        const code = [
            "interface P {",
            "    /**",
            "     * The a.",
            "     */",
            "    // @ts-expect-error legacy",
            "    a: string",
            "",
            "    /**",
            "     * The b.",
            "     */",
            "    b: number",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const code = "interface P {\n    a: string\n    /**\n     * The b.\n     */\n    b: number\n}"
        const messages = lintRule(RULE, code)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
