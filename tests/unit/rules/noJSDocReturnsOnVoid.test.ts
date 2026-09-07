import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-jsdoc-returns-on-void"

describe("no-jsdoc-returns-on-void", () => {
    test("It should not report a function that returns a value", ({ expect }) => {
        const code = "/**\n * Sums.\n * @returns The total.\n */\nfunction sum() {\n    return 1\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a void function without a @returns", ({ expect }) => {
        const code = "/**\n * Logs.\n */\nfunction log() {\n    console.log(1)\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a `@returns` on a `Promise<number>` function", ({ expect }) => {
        const code = "/**\n * Loads.\n * @returns The value.\n */\nasync function load(): Promise<number> {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report a @returns on a function with no return", ({ expect }) => {
        const code = "/**\n * Logs.\n * @returns Nothing.\n */\nfunction log() {\n    console.log(1)\n}"
        const messages = lintRule(RULE, code)

        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-jsdoc-returns-on-void")
        expect(messages[0]?.messageId).toBe("voidReturns")
    })

    test("It should report a @returns on a function with only a bare return", ({ expect }) => {
        const code = "/**\n * Guards.\n * @returns Nothing.\n */\nfunction guard() {\n    if (x) return\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report a @returns on a `: void` annotated function", ({ expect }) => {
        const code = "/**\n * Does.\n * @returns Nothing.\n */\nfunction run(): void {\n    doThing()\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report a @returns on a void class method", ({ expect }) => {
        const code =
            "class A {\n    /**\n     * Does.\n     * @returns Nothing.\n     */\n    run() {\n        doThing()\n    }\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report and fix a @returns on a `: void` arrow assigned to a const", ({ expect }) => {
        const code = "/**\n * Does.\n * @returns Nothing.\n */\nconst run = (): void => {\n    doThing()\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
        expect(fixRule(RULE, code)).toBe("/**\n * Does.\n */\nconst run = (): void => {\n    doThing()\n}")
    })

    test("It should remove the @returns block, keeping the rest of the JSDoc", ({ expect }) => {
        const code =
            "/**\n * Logs.\n * @param a The value.\n * @returns Nothing.\n */\nfunction log(a) {\n    use(a)\n}"
        const output = fixRule(RULE, code)
        expect(output).toBe("/**\n * Logs.\n * @param a The value.\n */\nfunction log(a) {\n    use(a)\n}")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const code = "/**\n * Logs.\n * @returns Nothing.\n */\nfunction log() {\n    console.log(1)\n}"
        const messages = lintRule(RULE, code)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
