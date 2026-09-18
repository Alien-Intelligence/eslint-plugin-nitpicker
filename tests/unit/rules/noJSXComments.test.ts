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

    test("It should not report an empty expression container with no comment", ({ expect }) => {
        expect(lintRule(RULE, "const x = <div>{}</div>", TSX)).toHaveLength(0)
    })

    test("It should not report a tooling directive, which only works where it sits", ({ expect }) => {
        const directives = [
            "{/* biome-ignore lint/a11y/noLabelWithoutControl: the input is external */}",
            "{/* prettier-ignore */}",
            "{/* @ts-expect-error the types disagree here */}",
        ]

        for (const directive of directives) {
            expect(lintRule(RULE, `const x = <div>${directive}<X /></div>`, TSX)).toHaveLength(0)
        }
    })

    test("It should report a container mixing a directive with prose", ({ expect }) => {
        const code = "const x = <div>{/* biome-ignore lint/style/noX: why */ /* Header */}<X /></div>"
        const messages = lintRule(RULE, code, TSX)

        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("jsxComment")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const x = <div>{/* Header */}</div>", TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
