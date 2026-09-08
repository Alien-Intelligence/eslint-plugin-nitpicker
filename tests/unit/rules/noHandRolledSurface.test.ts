import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-hand-rolled-surface"
const TSX = { filename: "Component.tsx" }

describe("no-hand-rolled-surface", () => {
    test("It should report a hand-drawn card surface", ({ expect }) => {
        const code = 'const x = <div className="rounded-lg border bg-card p-4" />'
        const messages = lintRule(RULE, code, TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("handRolled")
    })

    test("It should not report when the file uses the Card primitive", ({ expect }) => {
        const code = `
            import { Card, CardContent } from "@frontend/components/ui/card"
            const x = <div className="rounded-lg border bg-card p-4" />
        `
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should not report a plain bordered region with no card background", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="rounded-lg border p-4" />', TSX)).toHaveLength(0)
    })

    test("It should not report a background with no border", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="rounded-lg bg-card p-4" />', TSX)).toHaveLength(0)
    })

    test("It should not report a square bordered surface", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="border bg-card p-4" />', TSX)).toHaveLength(0)
    })

    test("It should assemble the surface across the arms of a cn() call", ({ expect }) => {
        const code = 'const x = <div className={cn("rounded-lg border", isOpen && "bg-card")} />'
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should not count classes from a nested render function", ({ expect }) => {
        const code = 'const x = <div className={cn("rounded-lg border", () => "bg-card")} />'
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should not treat a border-* utility as a border", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="rounded-lg border-t bg-card" />', TSX)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const code = 'const x = <div className="rounded-lg border bg-card" />'
        const messages = lintRule(RULE, code, TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
