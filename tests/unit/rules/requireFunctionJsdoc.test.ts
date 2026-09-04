import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

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

    test("It should report a nested named function by default", ({ expect }) => {
        const messages = lintRule(RULE, `${JSDOC}function outer() {\n    const inner = () => {}\n    return inner\n}`)
        expect(messages).toHaveLength(1)
    })

    test("It should not report a nested function when nested is not included", ({ expect }) => {
        const code = `${JSDOC}function outer() {\n    const inner = () => {}\n    return inner\n}`
        expect(lintRule(RULE, code, { options: [{ include: [] }] })).toHaveLength(0)
    })

    test("It should report a nested function declaration by default", ({ expect }) => {
        const code = `${JSDOC}function outer() {\n    function resolveInstance() {}\n    return resolveInstance\n}`
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report an undocumented class method by default", ({ expect }) => {
        const messages = lintRule(RULE, "class A {\n    run(id) {\n        go(id)\n    }\n}")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingJSDoc")
    })

    test("It should not report a documented class method", ({ expect }) => {
        const code = "class A {\n    /**\n     * Runs.\n     */\n    run(id) {\n        go(id)\n    }\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a class method when class-methods is not included", ({ expect }) => {
        const opts = { options: [{ include: ["nested"] }] }
        expect(lintRule(RULE, "class A {\n    run(id) {}\n}", opts)).toHaveLength(0)
    })

    test("It should not report an object-literal method by default", ({ expect }) => {
        const code = "const adapter = {\n    async beginTurn(input) {\n        return go(input)\n    },\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report an object-literal method when opted in", ({ expect }) => {
        const opts = { options: [{ include: ["object-methods"] }] }
        const code = "const adapter = {\n    async beginTurn(input) {\n        return go(input)\n    },\n}"
        expect(lintRule(RULE, code, opts)).toHaveLength(1)
    })

    test("It should not report an anonymous callback at any scope", ({ expect }) => {
        expect(lintRule(RULE, `${JSDOC}function outer() {\n    return [1].map(x => x)\n}`)).toHaveLength(0)
    })

    test("It should skip a computed member key", ({ expect }) => {
        const opts = { options: [{ include: ["class-methods", "object-methods"] }] }
        expect(lintRule(RULE, "class A {\n    [key](id) {}\n}", opts)).toHaveLength(0)
    })

    test("It should not report a callback", ({ expect }) => {
        const messages = lintRule(RULE, "[1, 2].map(x => x)")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a React component declaration returning JSX", ({ expect }) => {
        const messages = lintRule(RULE, "function Button() {\n    return <div />\n}", { filename: "Button.tsx" })
        expect(messages).toHaveLength(0)
    })

    test("It should not report a React component arrow returning JSX", ({ expect }) => {
        const messages = lintRule(RULE, "const Card = () => <div />", { filename: "Card.tsx" })
        expect(messages).toHaveLength(0)
    })

    test("It should not report a React component returning conditional JSX", ({ expect }) => {
        const messages = lintRule(RULE, "function Toggle() {\n    return on ? <a /> : <b />\n}", {
            filename: "Toggle.tsx",
        })
        expect(messages).toHaveLength(0)
    })

    test("It should report an undocumented function declaration", ({ expect }) => {
        const messages = lintRule(RULE, "function foo() {}")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-function-jsdoc")
        expect(messages[0]?.messageId).toBe("missingJSDoc")
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
        const messages = lintRule(RULE, "const renderIcon = () => <svg />", { filename: "renderIcon.tsx" })
        expect(messages).toHaveLength(1)
    })

    test("It should not treat a preceding line comment as documentation", ({ expect }) => {
        const messages = lintRule(RULE, "// not jsdoc\nfunction foo() {}")
        expect(messages).toHaveLength(1)
    })

    test("It should not report a lazy dynamic-import thunk", ({ expect }) => {
        const code = 'const UsersController = () => import("#controllers/users_controller")'
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should still report a thunk that does more than a bare import", ({ expect }) => {
        const code = 'const load = () => {\n    return import("#controllers/users_controller")\n}'
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a function documented above an ignore directive", ({ expect }) => {
        const biome =
            "/**\n * Sends it.\n */\n// biome-ignore lint/suspicious/useAwait: timing\nexport async function send() {}"
        expect(lintRule(RULE, biome)).toHaveLength(0)

        // Not an ESLint directive here, to avoid ESLint's own unused-directive noise
        const tsExpect = "/**\n * Sends it.\n */\n// @ts-expect-error legacy\nexport function send() {}"
        expect(lintRule(RULE, tsExpect)).toHaveLength(0)
    })

    test("It should still report a function with a directive but no JSDoc above it", ({ expect }) => {
        const code = "// biome-ignore lint/suspicious/useAwait: timing\nexport async function send() {}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "function foo() {}")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
