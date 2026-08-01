import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-british-english"

describe("no-british-english", () => {
    test("It should not report American spellings", ({ expect }) => {
        const messages = lintRule(RULE, "const color = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should not report an American identifier", ({ expect }) => {
        const messages = lintRule(RULE, "const normalizeData = () => {}")
        expect(messages).toHaveLength(0)
    })

    test("It should not report British spellings inside string literals", ({ expect }) => {
        const messages = lintRule(RULE, 'const label = "colour"')
        expect(messages).toHaveLength(0)
    })

    test("It should not report an external property read", ({ expect }) => {
        const messages = lintRule(RULE, "const x = response.colour")
        expect(messages).toHaveLength(0)
    })

    test("It should report a British identifier", ({ expect }) => {
        const messages = lintRule(RULE, "const colour = 1")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-british-english")
        expect(messages[0]?.messageId).toBe("british")
    })

    test("It should report a British sub-word inside a camelCase identifier", ({ expect }) => {
        const messages = lintRule(RULE, "const colourPicker = 1")
        expect(messages).toHaveLength(1)
    })

    test("It should report a British sub-word inside a SCREAMING_SNAKE identifier", ({ expect }) => {
        const messages = lintRule(RULE, "const COLOUR_MAP = 1")
        expect(messages).toHaveLength(1)
    })

    test("It should report a British word in a line comment", ({ expect }) => {
        const messages = lintRule(RULE, "// normalise the value")
        expect(messages).toHaveLength(1)
    })

    test("It should fix a British word in a comment", ({ expect }) => {
        const output = fixRule(RULE, "// the colour value")
        expect(output).toBe("// the color value")
    })

    test("It should preserve casing when fixing a comment", ({ expect }) => {
        const output = fixRule(RULE, "// Colour scheme")
        expect(output).toBe("// Color scheme")
    })

    test("It should add pairs from the extra option", ({ expect }) => {
        const messages = lintRule(RULE, "const lorry = 1", { options: [{ extra: { lorry: "truck" } }] })
        expect(messages).toHaveLength(1)
    })

    test("It should skip words listed in the ignore option", ({ expect }) => {
        const messages = lintRule(RULE, "const colour = 1", { options: [{ ignore: ["colour"] }] })
        expect(messages).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const colour = 1")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })

    test("It should not crash on identifiers containing Object.prototype names", ({ expect }) => {
        const messages = lintRule(
            RULE,
            'import type { BrowserWindowConstructorOptions, WebPreferences } from "electron"',
        )
        expect(messages.every(m => !m.fatal)).toBe(true)
        expect(messages).toHaveLength(0)
    })

    test("It should not report sub-words that only exist on Object.prototype", ({ expect }) => {
        const messages = lintRule(RULE, "const toStringValue = 1")
        expect(messages).toHaveLength(0)
    })
})
