import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-blank-before-return"

/**
 * Wraps statement lines in a function body, so a test only spells out the part
 * that matters.
 * @param lines The statement lines to place in the body.
 * @returns The wrapped source.
 */
function body(...lines: string[]): string {
    return ["function run() {", ...lines.map(line => (line === "" ? "" : `    ${line}`)), "}"].join("\n")
}

describe("require-blank-before-return", () => {
    test("It should report a flush return closing a four-statement block", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "return 4")
        const messages = lintRule(RULE, code)

        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-blank-before-return")
        expect(messages[0]?.messageId).toBe("blankLine")
    })

    test("It should report a flush return closing a five-statement block", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "const d = 4", "return 5")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report a trailing throw the same way", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "throw new Error('nope')")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report a rethrow closing a catch block", ({ expect }) => {
        const code = [
            "function run() {",
            "    try {",
            "        work()",
            "    } catch (error) {",
            "        log(error)",
            "        metric(error)",
            "        cleanup()",
            "        throw error",
            "    }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should point the report at the leading line comment, not the return", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "// Hand the total back", "return 4")
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.line).toBe(5)
    })

    test("It should point the report at a leading JSDoc block", ({ expect }) => {
        const code = [
            "function run() {",
            "    const a = 1",
            "    const b = 2",
            "    const c = 3",
            "    /**",
            "     * The total.",
            "     */",
            "    return 4",
            "}",
        ].join("\n")
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.line).toBe(5)
    })

    test("It should not treat a trailing comment on the previous line as separation", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3 // The last one", "return 4")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report once when a comment sits between with no blank line", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "// Wrap up", "return 4")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should honour a lower minStatements option", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "return 3")
        expect(lintRule(RULE, code)).toHaveLength(0)
        expect(lintRule(RULE, code, { options: [{ minStatements: 3 }] })).toHaveLength(1)
    })

    test("It should check a braceless switch case", ({ expect }) => {
        const code = [
            "function run(kind) {",
            "    switch (kind) {",
            "        case 'a':",
            "            first()",
            "            second()",
            "            third()",
            "            return 1",
            "    }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should check a static block", ({ expect }) => {
        const code = [
            "class Registry {",
            "    static {",
            "        first()",
            "        second()",
            "        third()",
            "        throw new Error('nope')",
            "    }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should check an immediately-invoked function body", ({ expect }) => {
        const code = [
            "const value = (() => {",
            "    const a = 1",
            "    const b = 2",
            "    const c = 3",
            "    return a",
            "})()",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report each offending block separately", ({ expect }) => {
        const code = [
            body("const a = 1", "const b = 2", "const c = 3", "return 4"),
            body("const d = 1", "const e = 2", "const f = 3", "return 4"),
        ].join("\n\n")
        expect(lintRule(RULE, code)).toHaveLength(2)
    })

    test("It should not report a block under the threshold", ({ expect }) => {
        expect(lintRule(RULE, body("const a = 1", "const b = 2", "return 3"))).toHaveLength(0)
    })

    test("It should not report a return that is the only statement", ({ expect }) => {
        expect(lintRule(RULE, body("return 1"))).toHaveLength(0)
    })

    test("It should not report when the blank line is already there", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "", "return 4")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a comment block that already has a blank line above it", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "", "// Wrap up", "return 4")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report when a blank line detaches the comment from the return", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "// Orphaned", "const c = 3", "", "return 4")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not visit an expression-bodied arrow", ({ expect }) => {
        expect(lintRule(RULE, "const value = () => 1 + 2 + 3 + 4")).toHaveLength(0)
    })

    test("It should not report a block written entirely on one line", ({ expect }) => {
        expect(lintRule(RULE, "function run() { a(); b(); c(); return 4 }")).toHaveLength(0)
    })

    test("It should not report a block that does not end in an exit", ({ expect }) => {
        expect(lintRule(RULE, body("const a = 1", "const b = 2", "const c = 3", "done()"))).toHaveLength(0)
    })

    test("It should not report a return consuming the declaration above it", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const total = a + b", "return total > 0")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report when the declared name is only used nested in the return", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const parts = [a, b]", "return parts.map(p => p * 2).join('')")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should still report when the return ignores the declaration above it", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const unused = 3", "return a + b")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report a consumed declaration when allowAfterDeclaration is off", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const total = a + b", "return total")
        expect(lintRule(RULE, code, { options: [{ allowAfterDeclaration: false }] })).toHaveLength(1)
    })

    test("It should insert the blank line, keeping the indentation", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "return 4")
        expect(fixRule(RULE, code)).toBe(body("const a = 1", "const b = 2", "const c = 3", "", "return 4"))
    })

    test("It should insert the blank line above the leading comment", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "// Wrap up", "return 4")
        expect(fixRule(RULE, code)).toBe(
            body("const a = 1", "const b = 2", "const c = 3", "", "// Wrap up", "return 4"),
        )
    })

    test("It should be idempotent under repeated fixing", ({ expect }) => {
        const code = body("const a = 1", "const b = 2", "const c = 3", "return 4")
        const once = fixRule(RULE, code)
        expect(fixRule(RULE, once)).toBe(once)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, body("const a = 1", "const b = 2", "const c = 3", "return 4"))
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
