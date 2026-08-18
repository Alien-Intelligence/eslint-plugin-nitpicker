import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-line-comment-backticks"

describe("no-line-comment-backticks", () => {
    test("It should not report a line comment without backticks", ({ expect }) => {
        expect(lintRule(RULE, "// Reads the token")).toHaveLength(0)
    })

    test("It should not report backticks inside a JSDoc block", ({ expect }) => {
        const code = "/**\n * Reads `token` from the request.\n */\nconst a = 1"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report backticks inside a plain block comment", ({ expect }) => {
        expect(lintRule(RULE, "/* Reads `token` here */\nconst a = 1")).toHaveLength(0)
    })

    test("It should report a back-ticked code reference", ({ expect }) => {
        const messages = lintRule(RULE, "// Reads `auth.user` from the context")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-line-comment-backticks")
        expect(messages[0]?.messageId).toBe("backticks")
    })

    test("It should name the wrapped text in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// Reads `auth.user` from the context")
        expect(messages[0]?.message).toContain("auth.user")
    })

    test("It should report the span of the whole reference", ({ expect }) => {
        const messages = lintRule(RULE, "// Reads `token` now")
        expect(messages[0]?.column).toBe(10)
        expect(messages[0]?.endColumn).toBe(17)
    })

    test("It should report each back-ticked reference separately", ({ expect }) => {
        expect(lintRule(RULE, "// Maps `a` onto `b`")).toHaveLength(2)
    })

    test("It should not report an unpaired backtick", ({ expect }) => {
        expect(lintRule(RULE, "// Reads `auth.user from the context")).toHaveLength(0)
    })

    test("It should not report a code fence", ({ expect }) => {
        expect(lintRule(RULE, "// Sample ```ts const a = 1``` here")).toHaveLength(0)
    })

    test("It should not report a span that already holds a double quote", ({ expect }) => {
        expect(lintRule(RULE, '// Calls `split(".")` on the key')).toHaveLength(0)
    })

    test("It should not report a tooling directive", ({ expect }) => {
        const code = "// biome-ignore lint/suspicious/noExplicitAny: `any` is needed here\nconst a: any = 1"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should rewrite a back-ticked reference with double quotes", ({ expect }) => {
        expect(fixRule(RULE, "// Reads `auth.user` from the context")).toBe('// Reads "auth.user" from the context')
    })

    test("It should rewrite every reference in the comment", ({ expect }) => {
        expect(fixRule(RULE, "// Maps `a` onto `b`")).toBe('// Maps "a" onto "b"')
    })

    test("It should rewrite a reference that spans the whole comment", ({ expect }) => {
        expect(fixRule(RULE, "// `foo.bar`")).toBe('// "foo.bar"')
    })

    test("It should keep a trailing comment on its line", ({ expect }) => {
        expect(fixRule(RULE, "const a = 1 // Holds `state.count`")).toBe('const a = 1 // Holds "state.count"')
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// Reads `token` now")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
