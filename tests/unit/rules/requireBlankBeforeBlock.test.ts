import { fixRule, lintRule } from "tests/utils/lint"
import { describe, expect, test } from "vitest"

const RULE = "require-blank-before-block"

/**
 * Wraps statement lines in a function body, so a test only spells out the part
 * that matters.
 * @param lines The statement lines to place in the body.
 * @returns The wrapped source.
 */
function body(...lines: string[]): string {
    return ["function run() {", ...lines.map(line => (line === "" ? "" : `    ${line}`)), "}"].join("\n")
}

describe("require-blank-before-block", () => {
    test("It should report a flush multi-line if block", ({ expect }) => {
        const code = body("start()", "if (ready) {", "    go()", "}")
        const messages = lintRule(RULE, code)

        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-blank-before-block")
        expect(messages[0]?.messageId).toBe("blankLine")
    })

    test.each([
        ["for", "for (let i = 0; i < 3; i++) {", "    go(i)", "}"],
        ["for-of", "for (const item of items) {", "    go(item)", "}"],
        ["for-in", "for (const key in bag) {", "    go(key)", "}"],
        ["while", "while (ready) {", "    go()", "}"],
        ["do-while", "do {", "    go()", "} while (ready)"],
        ["try", "try {", "    go()", "} catch {}"],
        ["switch", "switch (kind) {", "    case 'a':", "        break", "}"],
    ])("It should report a flush multi-line %s block", (_label, ...lines) => {
        const messages = lintRule(RULE, body("start()", ...lines))
        expect(messages).toHaveLength(1)
    })

    test("It should report a block preceded by a single-line guard", ({ expect }) => {
        const code = body("if (!ready) return", "if (other) {", "    go()", "}")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report a block preceded by another block", ({ expect }) => {
        const code = body("if (a) {", "    first()", "}", "if (b) {", "    second()", "}")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should point the report at the leading line comment", ({ expect }) => {
        const code = body("start()", "// Only when ready", "if (ready) {", "    go()", "}")
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.line).toBe(3)
    })

    test("It should point the report at a leading JSDoc block", ({ expect }) => {
        const code = body("start()", "/**", " * Only when ready.", " */", "if (ready) {", "    go()", "}")
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.line).toBe(3)
    })

    test("It should not treat a trailing comment on the previous line as separation", ({ expect }) => {
        const code = body("start() // Kick off", "if (ready) {", "    go()", "}")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should check the module top level", ({ expect }) => {
        const code = ["import x from 'x'", "if (x) {", "    go()", "}"].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should check a braceless switch case", ({ expect }) => {
        const code = [
            "function run(kind) {",
            "    switch (kind) {",
            "        case 'a':",
            "            start()",
            "            if (ready) {",
            "                go()",
            "            }",
            "            break",
            "    }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should check a static block", ({ expect }) => {
        const code = [
            "class Registry {",
            "    static {",
            "        start()",
            "        for (const item of items) {",
            "            go(item)",
            "        }",
            "    }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should see through a label to the loop it wraps", ({ expect }) => {
        const code = body("start()", "outer: for (const item of items) {", "    go(item)", "}")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report each offending block separately", ({ expect }) => {
        const code = body("start()", "if (a) {", "    first()", "}", "", "second()", "if (b) {", "    third()", "}")
        expect(lintRule(RULE, code)).toHaveLength(2)
    })

    test("It should not report a block opening its container", ({ expect }) => {
        expect(lintRule(RULE, body("if (ready) {", "    go()", "}", "", "done()"))).toHaveLength(0)
    })

    test("It should not report a single-line guard clause", ({ expect }) => {
        expect(lintRule(RULE, body("start()", "if (!ready) return null"))).toHaveLength(0)
    })

    test("It should not report a stack of single-line guards", ({ expect }) => {
        const code = body("start()", "if (!a) return null", "if (!b) return null", "if (!c) return null")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a single-line loop", ({ expect }) => {
        expect(lintRule(RULE, body("let total = 0", "start()", "for (const x of xs) total += x"))).toHaveLength(0)
    })

    test("It should not report anything in an else-if chain", ({ expect }) => {
        const code = body("if (a) {", "    first()", "} else if (b) {", "    second()", "} else {", "    third()", "}")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not require a blank line before catch or finally", ({ expect }) => {
        const code = body(
            "try {",
            "    go()",
            "} catch (error) {",
            "    log(error)",
            "} finally {",
            "    cleanup()",
            "}",
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a guard the formatter wrapped onto two lines", ({ expect }) => {
        const code = body(
            "start()",
            "if (someVeryLongConditionName || anotherEquallyLongConditionName || aThirdOne)",
            "    return null",
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report when the blank line is already there", ({ expect }) => {
        expect(lintRule(RULE, body("start()", "", "if (ready) {", "    go()", "}"))).toHaveLength(0)
    })

    test("It should not report a comment block that already has a blank line above it", ({ expect }) => {
        const code = body("start()", "", "// Only when ready", "if (ready) {", "    go()", "}")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a block sharing its line with the statement above", ({ expect }) => {
        expect(lintRule(RULE, "function run() { start(); if (ready) {\n    go()\n} }")).toHaveLength(0)
    })

    test("It should not require blank lines between switch cases", ({ expect }) => {
        const code = [
            "function run(kind) {",
            "    switch (kind) {",
            "        case 'a':",
            "            return 1",
            "        case 'b':",
            "            return 2",
            "    }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a branch on the declaration above it", ({ expect }) => {
        const code = body("start()", "const rank = compute()", "if (rank < max) {", "    go()", "}")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a loop consuming the declaration above it in its body", ({ expect }) => {
        const code = body("start()", "const names = []", "for (const p of ps) {", "    names.push(p)", "}")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should still report when the block ignores the declaration above it", ({ expect }) => {
        const code = body("start()", "const unused = compute()", "if (ready) {", "    go()", "}")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report a consumed declaration when allowAfterDeclaration is off", ({ expect }) => {
        const code = body("start()", "const rank = compute()", "if (rank < max) {", "    go()", "}")
        expect(lintRule(RULE, code, { options: [{ allowAfterDeclaration: false }] })).toHaveLength(1)
    })

    test("It should leave a multi-line IIFE alone, since it is not control flow", ({ expect }) => {
        const code = body("start()", ";(async () => {", "    await go()", "})()")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should insert the blank line, keeping the indentation", ({ expect }) => {
        const code = body("start()", "if (ready) {", "    go()", "}")
        expect(fixRule(RULE, code)).toBe(body("start()", "", "if (ready) {", "    go()", "}"))
    })

    test("It should insert the blank line above the leading comment", ({ expect }) => {
        const code = body("start()", "// Only when ready", "if (ready) {", "    go()", "}")
        expect(fixRule(RULE, code)).toBe(body("start()", "", "// Only when ready", "if (ready) {", "    go()", "}"))
    })

    test("It should fix two blocks in one pass, without padding the closing brace", ({ expect }) => {
        const code = body("start()", "if (a) {", "    first()", "}", "second()", "if (b) {", "    third()", "}")
        expect(fixRule(RULE, code)).toBe(
            body("start()", "", "if (a) {", "    first()", "}", "second()", "", "if (b) {", "    third()", "}"),
        )
    })

    test("It should be idempotent under repeated fixing", ({ expect }) => {
        const once = fixRule(RULE, body("start()", "if (ready) {", "    go()", "}"))
        expect(fixRule(RULE, once)).toBe(once)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, body("start()", "if (ready) {", "    go()", "}"))
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
