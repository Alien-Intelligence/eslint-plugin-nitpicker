import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-raw-color"
const TSX = { filename: "Component.tsx" }

describe("no-raw-color", () => {
    test("It should report a hex color in a className", ({ expect }) => {
        const messages = lintRule(RULE, 'const x = <div className="text-[#3b82f6]" />', TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("rawColor")
        expect(messages[0]?.message).toContain("#3b82f6")
    })

    test("It should report a hex color in a style object", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div style={{ color: "#FFFFFF" }} />', TSX)).toHaveLength(1)
    })

    test("It should report a hex color in a prop string", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <Progress color="#ffffff" />', TSX)).toHaveLength(1)
    })

    test("It should report a hex color inside a template literal", ({ expect }) => {
        expect(lintRule(RULE, `const x = \`linear-gradient(#3D3D3D, \${end})\``, TSX)).toHaveLength(1)
    })

    test("It should report the shorthand and alpha forms", ({ expect }) => {
        expect(lintRule(RULE, 'const a = "#fff"', TSX)).toHaveLength(1)
        expect(lintRule(RULE, 'const a = "#ffff"', TSX)).toHaveLength(1)
        expect(lintRule(RULE, 'const a = "#ffffff80"', TSX)).toHaveLength(1)
    })

    test("It should not report a token reference", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="bg-card text-foreground" />', TSX)).toHaveLength(0)
        expect(lintRule(RULE, 'const x = <div style={{ color: "var(--foreground)" }} />', TSX)).toHaveLength(0)
    })

    test("It should not report a hash that is not a color", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <a href="#section-two" />', TSX)).toHaveLength(0)
        expect(lintRule(RULE, 'const a = "#12345"', TSX)).toHaveLength(0)
    })

    test("It should not report prose in JSX text", ({ expect }) => {
        expect(lintRule(RULE, "const x = <p>340 S Lemon Ave #4133, Walnut</p>", TSX)).toHaveLength(0)
    })

    test("It should respect allowIn for a third-party brand mark", ({ expect }) => {
        const opts = { options: [{ allowIn: ["**/creditCard.tsx"] }], filename: "components/cards/creditCard.tsx" }
        expect(lintRule(RULE, 'const a = "#ED0006"', opts)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, 'const a = "#3b82f6"', TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
