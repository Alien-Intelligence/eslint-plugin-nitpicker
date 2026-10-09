import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-comment-semicolons"

describe("no-comment-semicolons", () => {
    test("It should not report a comment with no semicolon", ({ expect }) => {
        expect(lintRule(RULE, "// Reads the token, then caches it\nconst a = 1")).toHaveLength(0)
    })

    test("It should report a semicolon joining clauses in a line comment", ({ expect }) => {
        const messages = lintRule(RULE, "// Reads the token; caches it\nconst a = 1")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-comment-semicolons")
        expect(messages[0]?.messageId).toBe("semicolon")
        expect(messages[0]?.column).toBe(19)
    })

    test("It should report in block and JSDoc comments", ({ expect }) => {
        expect(lintRule(RULE, "/* Reads it; caches it */\nconst a = 1")).toHaveLength(1)
        expect(lintRule(RULE, "/**\n * Reads it; caches it.\n */\nconst a = 1")).toHaveLength(1)
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @param id The id; never empty.\n */\nfunction run(id) {}"),
        ).toHaveLength(1)
    })

    test("It should report a trailing semicolon", ({ expect }) => {
        expect(lintRule(RULE, "// const old = load();\nconst a = 1")).toHaveLength(1)
    })

    test("It should report every semicolon separately", ({ expect }) => {
        expect(lintRule(RULE, "// One; two; three\nconst a = 1")).toHaveLength(2)
    })

    test("It should not report a semicolon inside a token", ({ expect }) => {
        expect(lintRule(RULE, "// Loops with for(;;) until done\nconst a = 1")).toHaveLength(0)
        expect(lintRule(RULE, "// Parses a=1;b=2 pairs\nconst a = 1")).toHaveLength(0)
    })

    test("It should not report a semicolon inside a quoted or back-ticked span", ({ expect }) => {
        expect(lintRule(RULE, '// Emits "a(); b()" verbatim\nconst a = 1')).toHaveLength(0)
        expect(lintRule(RULE, "/**\n * Emits `a(); b()` verbatim.\n */\nconst a = 1")).toHaveLength(0)
    })

    test("It should not let an unpaired quote hide a later line", ({ expect }) => {
        expect(lintRule(RULE, '/**\n * It is 5" wide\n * Reads it; caches it "fast"\n */\nconst a = 1')).toHaveLength(1)
    })

    test("It should not report inside a fenced code block", ({ expect }) => {
        const code = "/**\n * Usage:\n * ```ts\n * const a = run();\n * ```\n */\nconst a = 1"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report inside an @example block", ({ expect }) => {
        const code =
            "/**\n * Runs.\n * @example\n * const a = run();\n * use(a);\n * @returns The id; or null.\n */\nfunction run() {}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.line).toBe(6)
    })

    test("It should not report an HTML entity", ({ expect }) => {
        expect(
            lintRule(RULE, "/**\n * Renders a &amp; b and &#169; and &#x2014; here.\n */\nconst a = 1"),
        ).toHaveLength(0)
    })

    test("It should not report a tooling directive", ({ expect }) => {
        expect(
            lintRule(RULE, "// biome-ignore lint/suspicious/noConsole: legacy; remove later\nconsole.log(1)"),
        ).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context", ({ expect }) => {
        const messages = lintRule(RULE, "// Reads it; caches it\nconst a = 1")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
