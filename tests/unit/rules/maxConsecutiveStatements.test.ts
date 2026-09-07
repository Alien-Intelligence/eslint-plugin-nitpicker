import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "max-consecutive-statements"

/**
 * Wraps statement lines in a function body, so a test only spells out the part
 * that matters.
 * @param lines The statement lines to place in the body.
 * @returns The wrapped source.
 */
function body(...lines: string[]): string {
    return ["function run() {", ...lines.map(line => (line === "" ? "" : `    ${line}`)), "}"].join("\n")
}

/**
 * Builds a run of distinct single-line calls.
 * @param count How many calls to build.
 * @param prefix The call-name prefix, so two runs can be told apart.
 * @returns The call lines.
 */
function calls(count: number, prefix = "step"): string[] {
    return Array.from({ length: count }, (_value, index) => `${prefix}${index}()`)
}

describe("max-consecutive-statements", () => {
    test("It should report a run of five statements at the default limit", ({ expect }) => {
        const messages = lintRule(RULE, body(...calls(5)))
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/max-consecutive-statements")
        expect(messages[0]?.messageId).toBe("tooMany")
    })

    test("It should report a long run exactly once, with the full count", ({ expect }) => {
        const messages = lintRule(RULE, body(...calls(8)))
        expect(messages).toHaveLength(1)
        expect(messages[0]?.message).toContain("run of 8 statements")
    })

    test("It should report two over-limit runs separately", ({ expect }) => {
        expect(lintRule(RULE, body(...calls(5, "a"), "", ...calls(5, "b")))).toHaveLength(2)
    })

    test("It should honour a lower max option", ({ expect }) => {
        expect(lintRule(RULE, body(...calls(3)), { options: [{ max: 2 }] })).toHaveLength(1)
    })

    test("It should check a braceless switch case", ({ expect }) => {
        const code = [
            "function run(kind) {",
            "    switch (kind) {",
            "        case 'a':",
            ...calls(5).map(line => `            ${line}`),
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
            ...calls(5).map(line => `        ${line}`),
            "    }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should check a nested block", ({ expect }) => {
        const code = body("if (ready) {", ...calls(5).map(line => `    ${line}`), "}")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not let a mid-run comment break the run", ({ expect }) => {
        expect(lintRule(RULE, body(...calls(3), "// Step two", ...calls(2, "later")))).toHaveLength(1)
    })

    test("It should point the report at the statement the run grew too long on", ({ expect }) => {
        const messages = lintRule(RULE, body(...calls(6)))
        expect(messages).toHaveLength(1)
        expect(messages[0]?.line).toBe(6)
    })

    test("It should report a run of differing calls, not just any long run", ({ expect }) => {
        const code = body("a.one = 1", "b.two = 2", "c.three = 3", "d.four = 4", "e.five = 5")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a run exactly at the limit", ({ expect }) => {
        expect(lintRule(RULE, body(...calls(4)))).toHaveLength(0)
    })

    test("It should not report two short runs split by a blank line", ({ expect }) => {
        expect(lintRule(RULE, body(...calls(3, "a"), "", ...calls(3, "b")))).toHaveLength(0)
    })

    test("It should not count a multi-line block that ends the run", ({ expect }) => {
        const code = body(...calls(4), "if (ready) {", "    go()", "}")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not count a trailing return, which the sibling rule owns", ({ expect }) => {
        expect(lintRule(RULE, body(...calls(4), "return 1"))).toHaveLength(0)
    })

    test("It should not report a wall of top-level imports", ({ expect }) => {
        const code = Array.from({ length: 35 }, (_value, index) => `import m${index} from 'm${index}'`).join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a wall of ambient declarations in a module block", ({ expect }) => {
        const code = [
            "declare module 'thing' {",
            ...Array.from({ length: 10 }, (_value, index) => `    export const v${index}: string`),
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report statements separated by a blank line each", ({ expect }) => {
        expect(lintRule(RULE, body(...calls(6).flatMap(line => [line, ""])))).toHaveLength(0)
    })

    test("It should let a mid-run multi-line statement split a long run in two", ({ expect }) => {
        const code = body(...calls(3, "a"), "if (ready) {", "    go()", "}", ...calls(3, "b"))
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not count a stack of guard clauses", ({ expect }) => {
        const code = body(
            "if (!a) return null",
            "if (!b) return null",
            "if (!c) return null",
            "if (!d) return null",
            "if (!e) return null",
            "if (!f) return null",
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should count an assignment table to one object as a single statement", ({ expect }) => {
        const code = body(
            ...Array.from({ length: 13 }, (_value, index) => `dataset.field${index} = input.field${index}`),
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should count a builder chain on one receiver as a single statement", ({ expect }) => {
        const code = body(
            'table.increments("id").primary()',
            'table.text("name").notNullable()',
            'table.text("slug").notNullable()',
            'table.boolean("is_public").notNullable()',
            'table.integer("organization_id").notNullable()',
            'table.timestamp("created_at").notNullable()',
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should count a block of assertions on one receiver as a single statement", ({ expect }) => {
        const code = body(
            "assert.isTrue(body.success)",
            "assert.exists(body.data)",
            "assert.equal(body.data.id, 1)",
            "assert.equal(body.data.name, 'a')",
            "assert.lengthOf(body.data.rows, 3)",
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should count a stack of the same hook as a single statement", ({ expect }) => {
        const code = body(
            "const [a, setA] = useState(null)",
            "const [b, setB] = useState(null)",
            "const [c, setC] = useState(null)",
            "const [d, setD] = useState(null)",
            "const [e, setE] = useState(null)",
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should count a conditional assignment table as a single statement", ({ expect }) => {
        const code = body(
            ...Array.from(
                { length: 7 },
                (_value, index) => `if (payload.f${index} !== undefined) turn.f${index} = payload.f${index}`,
            ),
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should still report a wall of differing bare calls", ({ expect }) => {
        expect(lintRule(RULE, body(...calls(6)))).toHaveLength(1)
    })

    test("It should still report assignments spread across differing receivers", ({ expect }) => {
        const code = body("a.one = 1", "b.two = 2", "c.three = 3", "d.four = 4", "e.five = 5")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should still report when an assignment table is padded out with other work", ({ expect }) => {
        const code = body(
            ...calls(4),
            ...Array.from({ length: 6 }, (_value, index) => `dataset.field${index} = input.field${index}`),
        )
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report an empty fallthrough case", ({ expect }) => {
        const code = [
            "function run(kind) {",
            "    switch (kind) {",
            "        case 'a':",
            "        case 'b':",
            "            return 1",
            "    }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a block written entirely on one line", ({ expect }) => {
        expect(lintRule(RULE, "function run() { a(); b(); c(); d(); e(); f() }")).toHaveLength(0)
    })

    test("It should not be fixable", ({ expect }) => {
        const code = body(...calls(5))
        expect(fixRule(RULE, code)).toBe(code)
    })

    test("It should reject a max of zero", ({ expect }) => {
        expect(() => lintRule(RULE, body(...calls(5)), { options: [{ max: 0 }] })).toThrow()
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, body(...calls(5)))
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
