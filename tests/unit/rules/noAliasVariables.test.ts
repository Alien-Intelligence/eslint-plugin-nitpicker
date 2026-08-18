import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-alias-variables"

describe("no-alias-variables", () => {
    test("It should not report a call result", ({ expect }) => {
        const messages = lintRule(RULE, "const user = getUser()")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a property access", ({ expect }) => {
        const messages = lintRule(RULE, "const name = user.name")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a `let` binding", ({ expect }) => {
        const messages = lintRule(RULE, "let alias = source")
        expect(messages).toHaveLength(0)
    })

    test("It should not report an exported binding", ({ expect }) => {
        const messages = lintRule(RULE, "export const Public = internal")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a snapshot of a reassigned source", ({ expect }) => {
        const code = "let nextIndex = 0\nconst index = nextIndex\nnextIndex += 1\nuse(index, nextIndex)"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a snapshot of a source assigned later", ({ expect }) => {
        const code = "let current\ncurrent = load()\nconst first = current\ncurrent = load()\nuse(first)"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report a rename of a `let` that is never reassigned", ({ expect }) => {
        expect(lintRule(RULE, "let source = 1\nconst alias = source\nuse(alias)")).toHaveLength(1)
    })

    test("It should not report a declaration kept for its type annotation", ({ expect }) => {
        const code = "const result = load()\nconst incoming: Record<string, unknown> = result\nuse(incoming)"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report a bare rename", ({ expect }) => {
        const messages = lintRule(RULE, "const accessTokens = rawAccessTokens")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-alias-variables")
        expect(messages[0]?.messageId).toBe("alias")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const alias = source")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
