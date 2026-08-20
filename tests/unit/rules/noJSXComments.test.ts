import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-jsx-comments"
const TSX = { filename: "Component.tsx" }

describe("no-jsx-comments", () => {
    test("It should report a JSX comment", ({ expect }) => {
        const messages = lintRule(RULE, "const x = <div>{/* Header */}</div>", TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-jsx-comments")
        expect(messages[0]?.messageId).toBe("jsxComment")
    })

    test("It should report each JSX comment separately", ({ expect }) => {
        const messages = lintRule(RULE, "const x = <div>{/* a */}<X />{/* b */}</div>", TSX)
        expect(messages).toHaveLength(2)
    })

    test("It should not report an ordinary JSX expression container", ({ expect }) => {
        expect(lintRule(RULE, "const x = <div>{value}</div>", TSX)).toHaveLength(0)
    })

    test("It should not report a regular block comment outside JSX", ({ expect }) => {
        expect(lintRule(RULE, "/* a note */\nconst x = 1", TSX)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const x = <div>{/* Header */}</div>", TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
