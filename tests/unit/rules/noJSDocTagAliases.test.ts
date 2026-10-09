import { fixRule, lintRule } from "tests/utils/lint"
import { describe, expect, test } from "vitest"

const RULE = "no-jsdoc-tag-aliases"

describe("no-jsdoc-tag-aliases", () => {
    test("It should not report the canonical tags", ({ expect }) => {
        const code =
            "/**\n * Runs.\n * @param id The id.\n * @returns The result.\n * @throws When it fails.\n */\nfunction run(id) {\n    return id\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report and rename @return", ({ expect }) => {
        const code = "/**\n * Runs.\n * @return The result.\n */\nfunction run() {\n    return 1\n}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-jsdoc-tag-aliases")
        expect(messages[0]?.messageId).toBe("alias")
        expect(messages[0]?.line).toBe(3)
        expect(fixRule(RULE, code)).toBe(
            "/**\n * Runs.\n * @returns The result.\n */\nfunction run() {\n    return 1\n}",
        )
    })

    test.each([
        ["arg", "param"],
        ["argument", "param"],
        ["exception", "throws"],
        ["yield", "yields"],
        ["prop", "property"],
        ["desc", "description"],
    ])("It should rename @%s to @%s", (alias, canonical) => {
        const code = `/**\n * Runs.\n * @${alias} x The thing.\n */\nfunction run(x) {}`
        expect(fixRule(RULE, code)).toBe(`/**\n * Runs.\n * @${canonical} x The thing.\n */\nfunction run(x) {}`)
    })

    test("It should rename every alias in one JSDoc", ({ expect }) => {
        const code =
            "/**\n * Runs.\n * @arg a The a.\n * @argument b The b.\n * @return The sum.\n */\nfunction run(a, b) {}"
        expect(lintRule(RULE, code)).toHaveLength(3)
        expect(fixRule(RULE, code)).toBe(
            "/**\n * Runs.\n * @param a The a.\n * @param b The b.\n * @returns The sum.\n */\nfunction run(a, b) {}",
        )
    })

    test("It should fix a single-line JSDoc", ({ expect }) => {
        expect(fixRule(RULE, "/** @return The id. */\nconst f = () => 1")).toBe(
            "/** @returns The id. */\nconst f = () => 1",
        )
    })

    test("It should not report a longer tag that starts like an alias", ({ expect }) => {
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @description Does it.\n * @property id The id.\n */\nconst a = 1"),
        ).toHaveLength(0)
    })

    test("It should not report an alias inside prose or an inline tag", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Use @return sparingly, see {@link run}.\n */\nconst a = 1")).toHaveLength(0)
    })

    test("It should ignore line and plain block comments", ({ expect }) => {
        expect(lintRule(RULE, "// @return x\n/* @return y */\nconst a = 1")).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Runs.\n * @return The id.\n */\nconst f = () => 1")
        expect(messages[0]?.message).toContain("`@returns`")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
