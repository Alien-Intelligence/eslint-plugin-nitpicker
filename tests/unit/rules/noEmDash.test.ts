import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-em-dash"

describe("no-em-dash", () => {
    test("It should not report code that contains no em dash", ({ expect }) => {
        const messages = lintRule(RULE, "const a = 1 // a plain hyphen - is fine")
        expect(messages).toHaveLength(0)
    })

    test("It should report an em dash inside a line comment", ({ expect }) => {
        const messages = lintRule(RULE, "// dash — here")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-em-dash")
        expect(messages[0]?.messageId).toBe("emDash")
    })

    test("It should report an em dash inside a string literal", ({ expect }) => {
        const messages = lintRule(RULE, 'const s = "a — b"')
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("emDash")
    })

    test("It should report an em dash inside a template literal", ({ expect }) => {
        const messages = lintRule(RULE, "const s = `a — b`")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("emDash")
    })

    test("It should report each em dash on a line separately", ({ expect }) => {
        const messages = lintRule(RULE, "// — and —")
        expect(messages).toHaveLength(2)
    })

    test("It should report the exact location of the em dash", ({ expect }) => {
        const messages = lintRule(RULE, "//—")
        expect(messages[0]?.line).toBe(1)
        expect(messages[0]?.column).toBe(3)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// —")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
