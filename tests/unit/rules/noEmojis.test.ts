import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-emojis"

describe("no-emojis", () => {
    test("It should not report code with no emoji", ({ expect }) => {
        expect(lintRule(RULE, "const a = 1 // a plain comment")).toHaveLength(0)
    })

    test("It should not report a text-default symbol without a variation selector", ({ expect }) => {
        expect(lintRule(RULE, "// © 2026 and (tm) marks are fine")).toHaveLength(0)
    })

    test("It should report an emoji inside a line comment", ({ expect }) => {
        const messages = lintRule(RULE, "// done 🎉 here")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-emojis")
        expect(messages[0]?.messageId).toBe("emoji")
    })

    test("It should report an emoji inside a string literal", ({ expect }) => {
        expect(lintRule(RULE, 'const s = "launch 🚀"')).toHaveLength(1)
    })

    test("It should count a ZWJ sequence as a single emoji", ({ expect }) => {
        expect(lintRule(RULE, 'const s = "family 👨‍👩‍👧"')).toHaveLength(1)
    })

    test("It should count a flag as a single emoji", ({ expect }) => {
        expect(lintRule(RULE, 'const s = "flag 🇫🇷"')).toHaveLength(1)
    })

    test("It should remove the emoji on fix", ({ expect }) => {
        expect(fixRule(RULE, 'const s = "hi🎉"')).toBe('const s = "hi"')
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// oops 🙈")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
