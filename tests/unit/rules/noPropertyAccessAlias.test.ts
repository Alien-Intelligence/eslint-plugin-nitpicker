import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-property-access-alias"

describe("no-property-access-alias", () => {
    test("It should not report a `let` binding", ({ expect }) => {
        const messages = lintRule(RULE, "let user = auth.user")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a call result", ({ expect }) => {
        const messages = lintRule(RULE, "const result = getUser()")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a method call", ({ expect }) => {
        const messages = lintRule(RULE, "const value = obj.method()")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a computed access", ({ expect }) => {
        const messages = lintRule(RULE, "const first = items[0]")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a bare identifier", ({ expect }) => {
        const messages = lintRule(RULE, "const copy = original")
        expect(messages).toHaveLength(0)
    })

    test("It should not report an exported binding", ({ expect }) => {
        const messages = lintRule(RULE, "export const port = config.port")
        expect(messages).toHaveLength(0)
    })

    test("It should report a plain property access", ({ expect }) => {
        const messages = lintRule(RULE, "const schema = validator.schema")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-property-access-alias")
        expect(messages[0]?.messageId).toBe("propertyAccessAlias")
    })

    test("It should report a non-null property access", ({ expect }) => {
        const messages = lintRule(RULE, "const user = auth.user!")
        expect(messages).toHaveLength(1)
    })

    test("It should report a nested property chain", ({ expect }) => {
        const messages = lintRule(RULE, "const path = menu.node.path")
        expect(messages).toHaveLength(1)
    })

    test("It should report a `this` property access", ({ expect }) => {
        const messages = lintRule(RULE, "class A {\n    m() {\n        const handler = this.handler\n    }\n}")
        expect(messages).toHaveLength(1)
    })

    test("It should report an optional property access", ({ expect }) => {
        const messages = lintRule(RULE, "const name = user?.name")
        expect(messages).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const schema = validator.schema")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
