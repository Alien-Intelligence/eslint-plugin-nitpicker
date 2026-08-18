import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-em-dash"

describe("no-em-dash", () => {
    test("It should not report code that contains no em dash", ({ expect }) => {
        const messages = lintRule(RULE, "const a = 1 // a plain hyphen - is fine")
        expect(messages).toHaveLength(0)
    })

    test("It should report an em dash inside a line comment", ({ expect }) => {
        const messages = lintRule(RULE, "// dash — here")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-em-dash")
        expect(messages[0]?.messageId).toBe("emDash")
    })

    test("It should report an em dash inside a string literal", ({ expect }) => {
        const messages = lintRule(RULE, 'const s = "a — b"')
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("emDash")
    })

    test("It should report an em dash inside a template literal", ({ expect }) => {
        const messages = lintRule(RULE, "const s = `a — b`")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("emDash")
    })

    test("It should report each em dash on a line separately", ({ expect }) => {
        const messages = lintRule(RULE, "// — and —")
        expect(messages).toHaveLength(2)
    })

    test("It should report the exact location of the em dash", ({ expect }) => {
        const messages = lintRule(RULE, "//—")
        expect(messages[0]?.line).toBe(1)
        expect(messages[0]?.column).toBe(3)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "// —")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })

    test("It should allow an em dash in a string when strings are allowed", ({ expect }) => {
        const code = 'const empty = "—"\nconst notice = "Your data — including logs — is deleted"'
        expect(lintRule(RULE, code, { options: [{ allow: ["strings"] }] })).toHaveLength(0)
    })

    test("It should allow an em dash in a template literal when templates are allowed", ({ expect }) => {
        const code = "const prompt = `You are an agent — be terse`"
        expect(lintRule(RULE, code, { options: [{ allow: ["templates"] }] })).toHaveLength(0)
    })

    test("It should allow an em dash in an interpolated template literal", ({ expect }) => {
        const code = `const prompt = \`Role: \${role} — be terse\``
        expect(lintRule(RULE, code, { options: [{ allow: ["templates"] }] })).toHaveLength(0)
    })

    test("It should allow an em dash in JSX text when jsx is allowed", ({ expect }) => {
        const code = "const page = <p>We store your data — securely</p>"
        const opts = {
            options: [{ allow: ["jsx"] }],
            filename: "page.tsx",
        }
        expect(lintRule(RULE, code, opts)).toHaveLength(0)
    })

    test("It should allow an em dash in a comment when comments are allowed", ({ expect }) => {
        expect(lintRule(RULE, "// dash — here", { options: [{ allow: ["comments"] }] })).toHaveLength(0)
    })

    test("It should still report an em dash outside the allowed locations", ({ expect }) => {
        const code = '// dash — here\nconst s = "a — b"'
        const messages = lintRule(RULE, code, { options: [{ allow: ["strings"] }] })
        expect(messages).toHaveLength(1)
        expect(messages[0]?.line).toBe(1)
    })

    test("It should report everywhere when the allow list is empty", ({ expect }) => {
        const code = '// dash — here\nconst s = "a — b"'
        expect(lintRule(RULE, code, { options: [{ allow: [] }] })).toHaveLength(2)
    })
})
