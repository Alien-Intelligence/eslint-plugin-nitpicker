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
