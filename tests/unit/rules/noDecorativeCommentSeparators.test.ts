import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-decorative-comment-separators"
const RULE_ID = "nitpicker/no-decorative-comment-separators"

describe("no-decorative-comment-separators", () => {
    test("It should not report a plain line comment", ({ expect }) => {
        const messages = lintRule(RULE, "// a normal note")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a JSDoc bullet list", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Steps:\n * - one\n * - two\n */\nconst a = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should not report an equality operator mentioned in a comment", ({ expect }) => {
        const messages = lintRule(RULE, "// use === not ==")
        expect(messages).toHaveLength(0)
    })

    test("It should report a banner of equals signs", ({ expect }) => {
        const messages = lintRule(RULE, "// ======================")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe(RULE_ID)
        expect(messages[0]?.messageId).toBe("decorative")
    })

    test("It should report a run of dashes", ({ expect }) => {
        const messages = lintRule(RULE, "// ------")
        expect(messages).toHaveLength(1)
    })

    test("It should report a box-drawing separator", ({ expect }) => {
        const messages = lintRule(RULE, "// ── General ──")
        expect(messages).toHaveLength(1)
    })

    test("It should report a label fenced by dashes", ({ expect }) => {
        const messages = lintRule(RULE, "// -- Validation --")
        expect(messages).toHaveLength(1)
    })

    test("It should report each decorative line of a block banner", ({ expect }) => {
        const messages = lintRule(RULE, "/*\n * ======\n * General\n * ======\n */\nconst a = 1")
        expect(messages).toHaveLength(2)
    })

    test("It should allow banners in files matched by allowIn", ({ expect }) => {
        const messages = lintRule(RULE, "// ======================\nconst a = 1", {
            filename: "packages/backend/start/routes.ts",
            options: [{ allowIn: ["**/start/routes.ts"] }],
        })
        expect(messages).toHaveLength(0)
    })

    test("It should still report banners in files not matched by allowIn", ({ expect }) => {
        const messages = lintRule(RULE, "// ======================\nconst a = 1", {
            filename: "app/controllers/home.ts",
            options: [{ allowIn: ["**/start/routes.ts"] }],
        })
        expect(messages).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// ======")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
