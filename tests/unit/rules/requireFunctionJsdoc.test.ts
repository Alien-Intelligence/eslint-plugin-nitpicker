import { describe, test } from "vitest"
import { lintRule } from "../../utils/lint"

const RULE = "require-function-jsdoc"

const JSDOC = "/**\n * Does a thing.\n */\n"

describe("require-function-jsdoc", () => {
    test("It should not report a documented function declaration", ({ expect }) => {
        const messages = lintRule(RULE, `${JSDOC}function foo() {}`)
        expect(messages).toHaveLength(0)
    })

    test("It should not report a documented arrow function constant", ({ expect }) => {
        const messages = lintRule(RULE, `${JSDOC}const foo = () => {}`)
        expect(messages).toHaveLength(0)
    })

    test("It should not report a documented exported function", ({ expect }) => {
        const messages = lintRule(RULE, `${JSDOC}export function foo() {}`)
        expect(messages).toHaveLength(0)
    })

    test("It should not report a nested function", ({ expect }) => {
        const messages = lintRule(RULE, `${JSDOC}function outer() {\n    const inner = () => {}\n    return inner\n}`)
        expect(messages).toHaveLength(0)
    })

    test("It should not report a callback", ({ expect }) => {
        const messages = lintRule(RULE, "[1, 2].map(x => x)")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a React component declaration returning JSX", ({ expect }) => {
        const messages = lintRule(RULE, "function Button() {\n    return <div />\n}")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a React component arrow returning JSX", ({ expect }) => {
        const messages = lintRule(RULE, "const Card = () => <div />")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a React component returning conditional JSX", ({ expect }) => {
        const messages = lintRule(RULE, "function Toggle() {\n    return on ? <a /> : <b />\n}")
        expect(messages).toHaveLength(0)
    })

    test("It should report an undocumented function declaration", ({ expect }) => {
        const messages = lintRule(RULE, "function foo() {}")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-function-jsdoc")
        expect(messages[0]?.messageId).toBe("missingJsdoc")
    })

    test("It should report an undocumented arrow function constant", ({ expect }) => {
        const messages = lintRule(RULE, "const foo = () => {}")
        expect(messages).toHaveLength(1)
    })

    test("It should report an undocumented function expression constant", ({ expect }) => {
        const messages = lintRule(RULE, "const foo = function () {}")
        expect(messages).toHaveLength(1)
    })

    test("It should report an undocumented exported function", ({ expect }) => {
        const messages = lintRule(RULE, "export function foo() {}")
        expect(messages).toHaveLength(1)
    })

    test("It should report a PascalCase function that does not return JSX", ({ expect }) => {
        const messages = lintRule(RULE, "function Button() {\n    return 42\n}")
        expect(messages).toHaveLength(1)
    })

    test("It should report a lowercase function that returns JSX", ({ expect }) => {
        const messages = lintRule(RULE, "const renderIcon = () => <svg />")
        expect(messages).toHaveLength(1)
    })

    test("It should not treat a preceding line comment as documentation", ({ expect }) => {
        const messages = lintRule(RULE, "// not jsdoc\nfunction foo() {}")
        expect(messages).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "function foo() {}")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
