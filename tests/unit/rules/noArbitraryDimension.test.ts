import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-arbitrary-dimension"
const TSX = { filename: "Component.tsx" }

describe("no-arbitrary-dimension", () => {
    test("It should report an arbitrary type size", ({ expect }) => {
        const messages = lintRule(RULE, 'const x = <span className="text-[10px]" />', TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("arbitrary")
        expect(messages[0]?.message).toContain("text-[10px]")
    })

    test("It should report arbitrary width and height", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="w-[774px] h-[460px]" />', TSX)).toHaveLength(2)
    })

    test("It should not report a value on the scale", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="w-full h-64 text-xs gap-2" />', TSX)).toHaveLength(0)
    })

    test("It should not report an arbitrary value in another unit", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="w-[50%] h-[3rem]" />', TSX)).toHaveLength(0)
    })

    test("It should not report an unlisted property", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="top-[10px]" />', TSX)).toHaveLength(0)
    })

    test("It should find the value inside a cn() call", ({ expect }) => {
        const code = 'const x = <div className={cn("flex", isSmall && "text-[10px]")} />'
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should find the value in a static part of an interpolated template", ({ expect }) => {
        expect(lintRule(RULE, `const x = <div className={\`\${base} w-[774px]\`} />`, TSX)).toHaveLength(1)
    })

    test("It should respect a narrowed properties option", ({ expect }) => {
        const opts = { options: [{ properties: ["text"] }], filename: "Component.tsx" }
        expect(lintRule(RULE, 'const x = <div className="text-[10px] w-[774px]" />', opts)).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, 'const x = <div className="text-[10px]" />', TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
