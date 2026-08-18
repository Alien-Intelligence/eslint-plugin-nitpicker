import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

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

    test("It should not report an ellipsis", ({ expect }) => {
        const messages = lintRule(RULE, "// wait...")
        expect(messages).toHaveLength(0)
    })

    test("It should not report an ellipsis inside a code reference path", ({ expect }) => {
        const messages = lintRule(RULE, "// roots like #models/... and #controllers/...")
        expect(messages).toHaveLength(0)
    })

    test("It should remove a trailing period", ({ expect }) => {
        const output = fixRule(RULE, "// trailing dot.")
        expect(output).toBe("// trailing dot")
    })

    test("It should split a mid-comment sentence onto its own line", ({ expect }) => {
        const output = fixRule(RULE, "// a. b")
        expect(output).toBe("// a\n// b")
    })

    test("It should keep the indentation when splitting a sentence", ({ expect }) => {
        const output = fixRule(RULE, "function f() {\n    // Does a thing. Then another\n}")
        expect(output).toBe("function f() {\n    // Does a thing\n    // Then another\n}")
    })

    test("It should split every sentence of a run-on comment", ({ expect }) => {
        const output = fixRule(RULE, "// One. Two. Three.")
        expect(output).toBe("// One\n// Two\n// Three")
    })

    test("It should report a mid-comment sentence as a run-on", ({ expect }) => {
        const messages = lintRule(RULE, "// Handles interaction. They are inlined")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("sentence")
    })

    test("It should not fix a trailing comment, splitting it would break the line", ({ expect }) => {
        const output = fixRule(RULE, "const a = 1 // Does a thing. Then another")
        expect(output).toBe("const a = 1 // Does a thing. Then another")
    })

    test("It should still remove the closing period of a trailing comment", ({ expect }) => {
        const output = fixRule(RULE, "const a = 1 // Does a thing.")
        expect(output).toBe("const a = 1 // Does a thing")
    })

    test("It should not touch a quoted period", ({ expect }) => {
        expect(fixRule(RULE, '// Cannot start with "."')).toBe('// Cannot start with "."')
        expect(fixRule(RULE, '// Calls split(".") on it')).toBe('// Calls split(".") on it')
    })

    test("It should not touch a period inside a back-ticked code reference", ({ expect }) => {
        expect(fixRule(RULE, "// Matches `a. b` exactly")).toBe("// Matches `a. b` exactly")
    })

    test("It should not treat an apostrophe as a quote", ({ expect }) => {
        const messages = lintRule(RULE, "// It doesn't matter.")
        expect(messages).toHaveLength(1)
    })

    test("It should not touch a dot followed by a glob or a path separator", ({ expect }) => {
        expect(fixRule(RULE, "// Emits subagent.* events")).toBe("// Emits subagent.* events")
        expect(fixRule(RULE, "// Resolves ./config first")).toBe("// Resolves ./config first")
        expect(fixRule(RULE, "// Walks up ../src too")).toBe("// Walks up ../src too")
    })

    test("It should not touch an abbreviation", ({ expect }) => {
        expect(fixRule(RULE, "// Wraps a value, e.g. a string")).toBe("// Wraps a value, e.g. a string")
        expect(fixRule(RULE, "// One thing, i.e. the other")).toBe("// One thing, i.e. the other")
        expect(fixRule(RULE, "// Tokens, headers, etc. are kept")).toBe("// Tokens, headers, etc. are kept")
    })

    test("It should report an abbreviation-looking word that is not one", ({ expect }) => {
        const messages = lintRule(RULE, "// Reads the manual.")
        expect(messages).toHaveLength(1)
    })

    test("It should leave an ellipsis untouched when fixing", ({ expect }) => {
        const output = fixRule(RULE, "// wait...")
        expect(output).toBe("// wait...")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// nope.")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
