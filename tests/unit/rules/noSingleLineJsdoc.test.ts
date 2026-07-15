import { describe, test } from "vitest"
import { fixRule, lintRule } from "../../utils/lint"

const RULE = "no-single-line-jsdoc"

describe("no-single-line-jsdoc", () => {
    test("It should not report a multi-line JSDoc comment", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * blabla\n */\nconst a = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a regular single-line block comment", ({ expect }) => {
        const messages = lintRule(RULE, "/* blabla */\nconst a = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a line comment", ({ expect }) => {
        const messages = lintRule(RULE, "// blabla\nconst a = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should not report an empty single-line JSDoc comment", ({ expect }) => {
        const messages = lintRule(RULE, "/** */\nconst a = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should report a single-line JSDoc comment", ({ expect }) => {
        const messages = lintRule(RULE, "/** blabla */\nconst a = 1")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-single-line-jsdoc")
        expect(messages[0]?.messageId).toBe("singleLine")
    })

    test("It should expand a single-line JSDoc comment onto multiple lines", ({ expect }) => {
        const output = fixRule(RULE, "/** blabla */\nconst a = 1")
        expect(output).toBe("/**\n * blabla\n */\nconst a = 1")
    })

    test("It should preserve indentation when expanding an indented JSDoc comment", ({ expect }) => {
        const output = fixRule(RULE, "class A {\n    /** blabla */\n    a = 1\n}")
        expect(output).toBe("class A {\n    /**\n     * blabla\n     */\n    a = 1\n}")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "/** blabla */")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
