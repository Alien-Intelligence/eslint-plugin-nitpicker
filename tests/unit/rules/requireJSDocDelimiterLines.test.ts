import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-jsdoc-delimiter-lines"

describe("require-jsdoc-delimiter-lines", () => {
    test("It should not report a well-formed JSDoc", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Does a thing.\n */\nfunction f() {}")).toHaveLength(0)
    })

    test("It should not report a well-formed JSDoc carrying tags", ({ expect }) => {
        const code = "/**\n * Does a thing.\n * @param a The value.\n * @returns The result.\n */\nfunction f(a) {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report text on the opening delimiter line", ({ expect }) => {
        const messages = lintRule(RULE, "/** Does a thing.\n * More text.\n */\nfunction f() {}")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-jsdoc-delimiter-lines")
        expect(messages[0]?.messageId).toBe("openingLine")
    })

    test("It should report text on the closing delimiter line", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Does a thing.\n * More text. */\nfunction f() {}")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("closingLine")
    })

    test("It should report both delimiters when both carry text", ({ expect }) => {
        const messages = lintRule(RULE, "/** Does a thing.\n * More text. */\nfunction f() {}")
        expect(messages).toHaveLength(2)
        expect(messages.map(m => m.messageId).sort()).toEqual(["closingLine", "openingLine"])
    })

    test("It should not report a single-line JSDoc (another rule's job)", ({ expect }) => {
        expect(lintRule(RULE, "/** Does a thing. */\nfunction f() {}")).toHaveLength(0)
    })

    test("It should not report a plain block comment", ({ expect }) => {
        expect(lintRule(RULE, "/* not a jsdoc\n   still not */\nconst a = 1")).toHaveLength(0)
    })

    test("It should not report line comments", ({ expect }) => {
        expect(lintRule(RULE, "// a note\n// another\nconst a = 1")).toHaveLength(0)
    })

    test("It should move the opening text onto its own line", ({ expect }) => {
        const output = fixRule(RULE, "/** Does a thing.\n * More text.\n */\nfunction f() {}")
        expect(output).toBe("/**\n * Does a thing.\n * More text.\n */\nfunction f() {}")
    })

    test("It should move the closing delimiter onto its own line", ({ expect }) => {
        const output = fixRule(RULE, "/**\n * Does a thing.\n * More text. */\nfunction f() {}")
        expect(output).toBe("/**\n * Does a thing.\n * More text. \n */\nfunction f() {}")
    })

    test("It should fix both delimiters at once", ({ expect }) => {
        const output = fixRule(RULE, "/** Does a thing.\n * More text. */\nfunction f() {}")
        expect(output).toBe("/**\n * Does a thing.\n * More text. \n */\nfunction f() {}")
    })

    test("It should keep the indentation of a nested JSDoc when fixing", ({ expect }) => {
        const code = "class A {\n    /** Does a thing.\n     * More.\n     */\n    run() {}\n}"
        const output = fixRule(RULE, code)
        expect(output).toBe("class A {\n    /**\n     * Does a thing.\n     * More.\n     */\n    run() {}\n}")
    })

    test("It should handle an opener with no space after the delimiter", ({ expect }) => {
        const output = fixRule(RULE, "/**Does a thing.\n * More.\n */\nfunction f() {}")
        expect(output).toBe("/**\n * Does a thing.\n * More.\n */\nfunction f() {}")
    })

    test("It should handle the real-world malformed shape", ({ expect }) => {
        const code = [
            "    /** Function-call names captured at output_item.added time, used by the",
            "     *  early tool-call-start emit (item.name is on the OutputItem; the",
            "     *  fullStream tool-call part has its own toolName too, both should",
            "     *  match). */",
            "    const names = {}",
        ].join("\n")
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(2)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "/** Does a thing.\n * More.\n */\nfunction f() {}")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
