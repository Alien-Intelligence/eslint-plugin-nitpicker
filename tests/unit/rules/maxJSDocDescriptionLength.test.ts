import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "max-jsdoc-description-length"

// The user's sample description, roughly 150 characters, should pass
const SAMPLE = [
    "/**",
    " * Aggregates data-token usage per billing subject from `call_logs` in the",
    " * period, external-api rows bill their endpoint, cluster-data rows their dataset.",
    " * @param organizationId The consumer org whose usage to sum.",
    " * @returns One bucket per subject with usage.",
    " */",
    "function f() {}",
].join("\n")

// A description far over the limit
const HUGE = [
    "/**",
    " * This function is used to compute the thing, and you should call it whenever",
    " * you need the thing computed, it handles all the edge cases and is very safe,",
    " * it was written to replace the old approach which was slow and hard to read,",
    " * prefer this one in all new code and avoid the deprecated helper entirely.",
    " */",
    "function f() {}",
].join("\n")

describe("max-jsdoc-description-length", () => {
    test("It should not report a concise description", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Sums usage per subject.\n */\nfunction f() {}")
        expect(messages).toHaveLength(0)
    })

    test("It should not report the two-line sample description", ({ expect }) => {
        const messages = lintRule(RULE, SAMPLE)
        expect(messages).toHaveLength(0)
    })

    test("It should not count tag lines towards the description", ({ expect }) => {
        const code = [
            "/**",
            " * Short summary.",
            " * @param a A parameter with a fairly long description that on its own would",
            " * push the comment well past the limit if tag lines were counted as prose.",
            " * @param b Another parameter with an equally verbose and lengthy explanation.",
            " */",
            "function f(a, b) {}",
        ].join("\n")
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(0)
    })

    test("It should report an oversized description", ({ expect }) => {
        const messages = lintRule(RULE, HUGE)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/max-jsdoc-description-length")
        expect(messages[0]?.messageId).toBe("tooLong")
    })

    test("It should respect a custom max option", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * A short description.\n */\nfunction f() {}", {
            options: [{ max: 5 }],
        })
        expect(messages).toHaveLength(1)
    })

    test("It should ignore non-JSDoc block comments", ({ expect }) => {
        const long = `/* ${"x".repeat(300)} */\nconst a = 1`
        const messages = lintRule(RULE, long)
        expect(messages).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, HUGE)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
