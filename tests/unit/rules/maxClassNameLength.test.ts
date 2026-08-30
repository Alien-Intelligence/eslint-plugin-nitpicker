import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "max-classname-length"
const TSX = { filename: "Component.tsx" }

// A class string comfortably over the 120-character default
const LONG = "class-name ".repeat(15).trim()

describe("max-classname-length", () => {
    test("It should not report a short className", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="flex items-center gap-2" />', TSX)).toHaveLength(0)
    })

    test("It should report an over-long string className", ({ expect }) => {
        const messages = lintRule(RULE, `const x = <div className="${LONG}" />`, TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/max-classname-length")
        expect(messages[0]?.messageId).toBe("tooLong")
    })

    test("It should report an over-long string in an expression container", ({ expect }) => {
        expect(lintRule(RULE, `const x = <div className={"${LONG}"} />`, TSX)).toHaveLength(1)
    })

    test("It should report an over-long non-interpolated template className", ({ expect }) => {
        expect(lintRule(RULE, `const x = <div className={\`${LONG}\`} />`, TSX)).toHaveLength(1)
    })

    test("It should report a long string inside a `cn()` call", ({ expect }) => {
        const code = `const x = <div className={cn("${LONG}", className)} />`
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should not report a `cn()` call of short strings", ({ expect }) => {
        const code = 'const x = <div className={cn("flex gap-2", isActive && "on", className)} />'
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should respect a custom max option", ({ expect }) => {
        const opts = { options: [{ max: 5 }], filename: "Component.tsx" }
        expect(lintRule(RULE, 'const x = <div className="flex items-center" />', opts)).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, `const x = <div className="${LONG}" />`, TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
