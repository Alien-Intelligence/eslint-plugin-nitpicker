import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-capitalized-comments"

describe("require-capitalized-comments", () => {
    test("It should not report a line comment that starts uppercase", ({ expect }) => {
        expect(lintRule(RULE, "// Hello there")).toHaveLength(0)
    })

    test("It should report a line comment that starts lowercase", ({ expect }) => {
        const messages = lintRule(RULE, "// hello there")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-capitalized-comments")
        expect(messages[0]?.messageId).toBe("capitalize")
    })

    test("It should not report a wrapped continuation line", ({ expect }) => {
        // The second line continues the first, so its lowercase start is fine
        expect(lintRule(RULE, "// A sentence that wraps\n// onto the next line")).toHaveLength(0)
    })

    test("It should still report the first line of a wrapped comment", ({ expect }) => {
        expect(lintRule(RULE, "// a sentence that wraps\n// onto the next line")).toHaveLength(1)
    })

    test("It should not report a tooling directive", ({ expect }) => {
        expect(lintRule(RULE, "// biome-ignore lint: needed here")).toHaveLength(0)
        expect(lintRule(RULE, "// @ts-expect-error legacy shim")).toHaveLength(0)
    })

    test("It should not report a comment opening with a symbol, code, or number", ({ expect }) => {
        expect(lintRule(RULE, "// `foo` returns bar")).toHaveLength(0)
        expect(lintRule(RULE, "// 3 things remain")).toHaveLength(0)
    })

    test("It should not report a comment opening with a URL", ({ expect }) => {
        expect(lintRule(RULE, "// https://example.com/docs")).toHaveLength(0)
    })

    test("It should report a lowercase JSDoc description", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * hello world\n */")).toHaveLength(1)
    })

    test("It should not report a JSDoc that opens with a tag", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * @param a The value.\n */")).toHaveLength(0)
    })

    test("It should capitalize the first letter of a line comment on fix", ({ expect }) => {
        expect(fixRule(RULE, "// hello world")).toBe("// Hello world")
    })

    test("It should capitalize the first letter of a block comment on fix", ({ expect }) => {
        expect(fixRule(RULE, "/**\n * hello world\n */")).toBe("/**\n * Hello world\n */")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// oops here")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
