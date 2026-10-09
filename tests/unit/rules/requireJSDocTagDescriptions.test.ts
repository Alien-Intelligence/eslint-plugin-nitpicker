import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-jsdoc-tag-descriptions"

describe("require-jsdoc-tag-descriptions", () => {
    test("It should not report described tags", ({ expect }) => {
        const code =
            "/**\n * Sends it.\n * @param user The user.\n * @returns The id.\n */\nfunction send(user) {\n    return 1\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report a bare @param", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Sends it.\n * @param user\n */\nfunction send(user) {}")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-jsdoc-tag-descriptions")
        expect(messages[0]?.messageId).toBe("missingDescription")
        expect(messages[0]?.message).toContain("`@param user`")
        expect(messages[0]?.line).toBe(3)
    })

    test("It should report a bare @returns and @return", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n * @returns\n */\nfunction run() {\n    return 1\n}")).toHaveLength(1)
        expect(lintRule(RULE, "/**\n * Runs.\n * @return\n */\nfunction run() {\n    return 1\n}")).toHaveLength(1)
    })

    test("It should report a tag that stops at its type", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n * @param {string} id\n */\nfunction run(id) {}")).toHaveLength(1)
        expect(lintRule(RULE, "/**\n * Runs.\n * @returns {number}\n */\nfunction run() {}")).toHaveLength(1)
    })

    test("It should skip a nested type whole", ({ expect }) => {
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @returns {Promise<{ id: string }>}\n */\nfunction run() {}"),
        ).toHaveLength(1)

        const described = "/**\n * Runs.\n * @returns {Promise<{ id: string }>} The record.\n */\nfunction run() {}"
        expect(lintRule(RULE, described)).toHaveLength(0)
    })

    test("It should report a bracketed optional name with no description", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n * @param [limit=10]\n */\nfunction run(limit) {}")).toHaveLength(1)
        expect(lintRule(RULE, '/**\n * Runs.\n * @param [label="a b"]\n */\nfunction run(label) {}')).toHaveLength(1)
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @param [limit=10] The cap.\n */\nfunction run(limit) {}"),
        ).toHaveLength(0)
    })

    test("It should report a dash with nothing after it", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n * @param id -\n */\nfunction run(id) {}")).toHaveLength(1)
        expect(lintRule(RULE, "/**\n * Runs.\n * @param id - The id.\n */\nfunction run(id) {}")).toHaveLength(0)
    })

    test("It should accept a description that starts with a negative number", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Finds it.\n * @returns -1 when missing.\n */\nfunction find() {}")).toHaveLength(
            0,
        )
    })

    test("It should accept a description wrapped onto the next line", ({ expect }) => {
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @param id\n *   The id, wrapped.\n */\nfunction run(id) {}"),
        ).toHaveLength(0)
    })

    test("It should accept an inline tag as the description", ({ expect }) => {
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @returns {@link Result} for the run.\n */\nfunction run() {}"),
        ).toHaveLength(0)
    })

    test("It should accept a parent object documented through its members", ({ expect }) => {
        const code =
            "/**\n * Runs.\n * @param {Object} options\n * @param {string} options.id The id.\n */\nfunction run(options) {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should still report a bare member", ({ expect }) => {
        const code =
            "/**\n * Runs.\n * @param options The options.\n * @param options.id\n */\nfunction run(options) {}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.message).toContain("`@param options.id`")
    })

    test("It should report each bare tag separately", ({ expect }) => {
        const code = "/**\n * Runs.\n * @param a\n * @param b\n * @returns\n */\nfunction run(a, b) {}"
        expect(lintRule(RULE, code)).toHaveLength(3)
    })

    test("It should check a single-line JSDoc", ({ expect }) => {
        expect(lintRule(RULE, "/** @param id */\nfunction run(id) {}")).toHaveLength(1)
    })

    test("It should not check other tags", ({ expect }) => {
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @deprecated\n * @throws {Error}\n */\nfunction run() {}"),
        ).toHaveLength(0)
    })

    test("It should ignore non-JSDoc comments", ({ expect }) => {
        expect(lintRule(RULE, "// @param id\n/* @returns */\nconst a = 1")).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context", ({ expect }) => {
        const messages = lintRule(RULE, "/**\n * Runs.\n * @param id\n */\nfunction run(id) {}")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
