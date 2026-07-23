import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-jsdoc-blank-before-tags"

describe("no-jsdoc-blank-before-tags", () => {
    test("It should not report a JSDoc with no blank line before its tags", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Does a thing.\n * @param a The value.\n */\nconst x = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a JSDoc with no tags at all", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Does a thing.\n *\n * More detail.\n */\nconst x = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a single-line JSDoc", ({ expect }) => {
        const messages = lintRule(RULE, "/** Does a thing. */\nconst x = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should report a blank line between the description and a tag", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Does a thing.\n *\n * @param a The value.\n */\nconst x = 1")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-jsdoc-blank-before-tags")
        expect(messages[0]?.messageId).toBe("blankBeforeTag")
    })

    test("It should report a blank line between two tags", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * @param a The value.\n *\n * @returns The result.\n */\nconst x = 1")
        expect(messages).toHaveLength(1)
    })

    test("It should remove the blank line before a tag", ({ expect }) => {
        const output = fixRule(RULE, "/**\n * Does a thing.\n *\n * @param a The value.\n */\nconst x = 1")
        expect(output).toBe("/**\n * Does a thing.\n * @param a The value.\n */\nconst x = 1")
    })

    test("It should collapse several blank lines before a tag", ({ expect }) => {
        const output = fixRule(RULE, "/**\n * Does a thing.\n *\n *\n * @param a The value.\n */\nconst x = 1")
        expect(output).toBe("/**\n * Does a thing.\n * @param a The value.\n */\nconst x = 1")
    })

    test("It should preserve a blank line that separates description paragraphs", ({ expect }) => {
        const code = "/**\n * First paragraph.\n *\n * Second paragraph.\n * @param a The value.\n */\nconst x = 1"
        const output = fixRule(RULE, code)
        expect(output).toBe(code)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Does a thing.\n *\n * @returns The result.\n */\nconst x = 1")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
