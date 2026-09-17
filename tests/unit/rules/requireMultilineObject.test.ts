import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-multiline-object"

describe("require-multiline-object", () => {
    test("It should not report an object with two properties on one line", ({ expect }) => {
        expect(lintRule(RULE, "const x = { a: 1, b: 2 }")).toHaveLength(0)
    })

    test("It should not report an object that already spans multiple lines", ({ expect }) => {
        const code = "const x = {\n    a: 1,\n    b: 2,\n    c: 3,\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report an object pattern (destructuring)", ({ expect }) => {
        expect(lintRule(RULE, "const { a, b, c } = obj")).toHaveLength(0)
    })

    test("It should report an inline object with more than two properties", ({ expect }) => {
        const messages = lintRule(RULE, "const x = { a: 1, b: 2, c: 3 }")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-multiline-object")
        expect(messages[0]?.messageId).toBe("shouldWrap")
    })

    test("It should expand an inline object one property per line, matching indentation", ({ expect }) => {
        const code = 'function f() {\n    setState({ status: "error", error: convert(err), progress: null })\n}'
        const output = fixRule(RULE, code)
        const expected =
            'function f() {\n    setState({\n        status: "error",\n        error: convert(err),\n        progress: null,\n    })\n}'
        expect(output).toBe(expected)
    })

    test("It should expand a top-level object back to the statement indentation", ({ expect }) => {
        const output = fixRule(RULE, "const x = { a: 1, b: 2, c: 3 }")
        expect(output).toBe("const x = {\n    a: 1,\n    b: 2,\n    c: 3,\n}")
    })

    test("It should respect a custom maxKeys option", ({ expect }) => {
        const opts = { options: [{ maxKeys: 3, indent: 4 }] }
        expect(lintRule(RULE, "const x = { a: 1, b: 2, c: 3 }", opts)).toHaveLength(0)
        expect(lintRule(RULE, "const x = { a: 1, b: 2, c: 3, d: 4 }", opts)).toHaveLength(1)
    })

    test("It should report but not fix an object containing a comment (never drop it)", ({ expect }) => {
        const code = "const x = { a: 1, /* keep me */ b: 2, c: 3 }"
        const messages = lintRule(RULE, code)

        expect(messages).toHaveLength(1)
        expect(messages[0]?.fix).toBeUndefined()
        // The fixer must leave the source untouched rather than dropping the comment
        expect(fixRule(RULE, code)).toBe(code)
    })

    test("It should not report the rows of a record table", ({ expect }) => {
        const code = [
            "const TERMINALS = [",
            '    { command: "wt", args: ["-d"], appendDir: true },',
            '    { command: "cmd", args: ["/c"], appendDir: false },',
            '    { command: "pwsh", args: ["-NoExit"], appendDir: true },',
            "]",
        ].join("\n")

        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report an object nested inside a record table row", ({ expect }) => {
        const code = [
            "const TERMINALS = [",
            '    { command: "wt", opts: { a: 1, b: 2, c: 3 }, appendDir: true },',
            '    { command: "cmd", opts: { a: 4, b: 5, c: 6 }, appendDir: false },',
            "]",
        ].join("\n")

        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report an array whose entries carry different keys", ({ expect }) => {
        const code = [
            "const TERMINALS = [",
            '    { command: "wt", args: ["-d"], appendDir: true },',
            '    { command: "cmd", flags: ["/c"], appendDir: false },',
            "]",
        ].join("\n")

        expect(lintRule(RULE, code)).toHaveLength(2)
    })

    test("It should report rows packed onto one line, which have no column to scan", ({ expect }) => {
        expect(lintRule(RULE, "const x = [{ a: 1, b: 2, c: 3 }, { a: 4, b: 5, c: 6 }]")).toHaveLength(2)
    })

    test("It should report a lone object in an array, which is no table", ({ expect }) => {
        expect(lintRule(RULE, "const x = [\n    { a: 1, b: 2, c: 3 },\n]")).toHaveLength(1)
    })

    test("It should exempt a file matched by the allowIn option", ({ expect }) => {
        const opts = { options: [{ allowIn: ["**/constants.ts"] }], filename: "src/constants.ts" }
        expect(lintRule(RULE, "const x = { a: 1, b: 2, c: 3 }", opts)).toHaveLength(0)
        expect(lintRule(RULE, "const x = { a: 1, b: 2, c: 3 }", { ...opts, filename: "src/other.ts" })).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const x = { a: 1, b: 2, c: 3 }")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
