import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-palette-bypass"
const TSX = { filename: "badge.tsx" }

/**
 * Builds a cva call with the given variant map body.
 * @param body The variant entries to place under `variants.variant`.
 * @returns The source of a cva call.
 */
function cva(body: string): string {
    return `const badgeVariants = cva("inline-flex", { variants: { variant: { ${body} } } })`
}

describe("no-palette-bypass", () => {
    test("It should report a semantic variant using the raw palette", ({ expect }) => {
        const messages = lintRule(RULE, cva('success: "bg-green-100 text-green-800"'), TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("paletteBypass")
        expect(messages[0]?.message).toContain("green-100")
    })

    test("It should name the token the variant should use", ({ expect }) => {
        expect(lintRule(RULE, cva('warning: "bg-amber-100"'), TSX)[0]?.message).toContain("--warning")
    })

    test("It should report each offending variant", ({ expect }) => {
        const code = cva('success: "bg-green-100", warning: "bg-amber-100"')
        expect(lintRule(RULE, code, TSX)).toHaveLength(2)
    })

    test("It should not report a semantic variant built on tokens", ({ expect }) => {
        expect(lintRule(RULE, cva('success: "bg-success text-success-foreground"'), TSX)).toHaveLength(0)
    })

    test("It should not report a non-semantic variant using the palette", ({ expect }) => {
        expect(lintRule(RULE, cva('brand: "bg-blue-500"'), TSX)).toHaveLength(0)
    })

    test("It should not report a palette class outside a variant map", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="bg-green-100" />', TSX)).toHaveLength(0)
    })

    test("It should not look at a size variant group", ({ expect }) => {
        const code = 'const v = cva("x", { variants: { size: { success: "bg-green-100" } } })'
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should read a quoted variant key", ({ expect }) => {
        expect(lintRule(RULE, cva('"success": "bg-green-100"'), TSX)).toHaveLength(1)
    })

    test("It should respect a token overridden by the consumer", ({ expect }) => {
        const opts = { options: [{ tokens: { success: "--info" } }], filename: "badge.tsx" }
        const messages = lintRule(RULE, cva('success: "bg-green-100"'), opts)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.message).toContain("--info")
    })

    test("It should keep the default tokens alongside an override", ({ expect }) => {
        const opts = { options: [{ tokens: { success: "--info" } }], filename: "badge.tsx" }
        const messages = lintRule(RULE, cva('success: "bg-green-100", warning: "bg-amber-100"'), opts)
        expect(messages).toHaveLength(2)
        expect(messages[1]?.message).toContain("--warning")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, cva('success: "bg-green-100"'), TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
