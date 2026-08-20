import { lintRule } from "tests/utils/lint"
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

    test("It should not offer an autofix (report-only, to never delete a meaningful glyph)", ({ expect }) => {
        const messages = lintRule(RULE, 'const s = "hi🎉"')
        expect(messages).toHaveLength(1)
        expect(messages[0]?.fix).toBeUndefined()
    })

    test("It should exempt emoji in strings when `allow` includes strings", ({ expect }) => {
        const opts = { options: [{ allow: ["strings"] }] }
        expect(lintRule(RULE, 'const s = "launch 🚀"', opts)).toHaveLength(0)
        // A comment emoji is still flagged, only strings were allowed
        expect(lintRule(RULE, "// done 🎉", opts)).toHaveLength(1)
    })

    test("It should exempt emoji in comments when `allow` includes comments", ({ expect }) => {
        const opts = { options: [{ allow: ["comments"] }] }
        expect(lintRule(RULE, "// warning ⚠️ here", opts)).toHaveLength(0)
    })

    test("It should exempt emoji in a template literal when `allow` includes templates", ({ expect }) => {
        const opts = { options: [{ allow: ["templates"] }] }
        expect(lintRule(RULE, "const s = `hi 🎉`", opts)).toHaveLength(0)
        // A string emoji is still flagged, only templates were allowed
        expect(lintRule(RULE, 'const s = "hi 🎉"', opts)).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// oops 🙈")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
