import { describe, test } from "vitest"
import { fixRule, lintRule } from "../../utils/lint"

const RULE = "no-line-comment-period"

describe("no-line-comment-period", () => {
    test("It should not report a line comment without any period", ({ expect }) => {
        const messages = lintRule(RULE, "// short and clear")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a dot inside a code reference", ({ expect }) => {
        const messages = lintRule(RULE, "// uses bla.object in code")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a decimal number", ({ expect }) => {
        const messages = lintRule(RULE, "// pi is about 3.14 here")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a file name", ({ expect }) => {
        const messages = lintRule(RULE, "// see config.ts for details")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a leading-dot name", ({ expect }) => {
        const messages = lintRule(RULE, "// the .env file")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a chained code reference", ({ expect }) => {
        const messages = lintRule(RULE, "// chain a.b.c.d works")
        expect(messages).toHaveLength(0)
    })

    test("It should not report periods in a block comment", ({ expect }) => {
        const messages = lintRule(RULE, "/* has a period. */\nconst a = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should report a trailing period", ({ expect }) => {
        const messages = lintRule(RULE, "// trailing dot.")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-line-comment-period")
        expect(messages[0]?.messageId).toBe("period")
    })

    test("It should report a period followed by a space", ({ expect }) => {
        const messages = lintRule(RULE, "// Two sentences. Here too")
        expect(messages).toHaveLength(1)
    })

    test("It should report each prose period separately", ({ expect }) => {
        const messages = lintRule(RULE, "// One. Two. Three.")
        expect(messages).toHaveLength(3)
    })

    test("It should report only the trailing period of a code reference", ({ expect }) => {
        const messages = lintRule(RULE, "// see bla.object.")
        expect(messages).toHaveLength(1)
    })

    test("It should group a run of dots (ellipsis) into a single report", ({ expect }) => {
        const messages = lintRule(RULE, "// wait...")
        expect(messages).toHaveLength(1)
    })

    test("It should remove a trailing period", ({ expect }) => {
        const output = fixRule(RULE, "// trailing dot.")
        expect(output).toBe("// trailing dot")
    })

    test("It should remove a mid-comment period without collapsing spacing", ({ expect }) => {
        const output = fixRule(RULE, "// a. b")
        expect(output).toBe("// a b")
    })

    test("It should remove an ellipsis run", ({ expect }) => {
        const output = fixRule(RULE, "// wait...")
        expect(output).toBe("// wait")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// nope.")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
