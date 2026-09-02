import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-complete-jsdoc"
const TSX = { filename: "Component.tsx" }

describe("require-complete-jsdoc", () => {
    test("It should not report an undocumented function (presence is another rule's job)", ({ expect }) => {
        expect(lintRule(RULE, "function send(user, url) {\n    return 1\n}")).toHaveLength(0)
    })

    test("It should not report a fully documented function", ({ expect }) => {
        const code =
            "/**\n * Sends it.\n * @param user The user.\n * @param url The link.\n * @returns The id.\n */\nfunction send(user, url) {\n    return 1\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report a parameter with no @param", ({ expect }) => {
        const code =
            "/**\n * Sends it.\n * @param user The user.\n * @returns The id.\n */\nfunction send(user, url) {\n    return 1\n}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-complete-jsdoc")
        expect(messages[0]?.messageId).toBe("missingParam")
    })

    test("It should report every undocumented parameter separately", ({ expect }) => {
        const code = "/**\n * Sends it.\n * @returns The id.\n */\nfunction send(user, url, force) {\n    return 1\n}"
        expect(lintRule(RULE, code)).toHaveLength(3)
    })

    test("It should not require @param on a zero-arg function", ({ expect }) => {
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @returns The id.\n */\nfunction run() {\n    return 1\n}"),
        ).toHaveLength(0)
    })

    // Destructured parameters are documented by their property names
    test("It should accept a destructured object documented by its properties", ({ expect }) => {
        const code =
            "/**\n * Sends it.\n * @param user The user.\n * @param url The link.\n */\nasync function send({ user, url }) {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report a destructured property with no @param", ({ expect }) => {
        const code = "/**\n * Sends it.\n * @param user The user.\n */\nasync function send({ user, url }) {}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingParam")
    })

    test("It should expect the rest name of a destructured rest element", ({ expect }) => {
        const code = "/**\n * Sends it.\n * @param user The user.\n */\nasync function send({ user, ...rest }) {}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should accept a destructured object documented under one whole-object name", ({ expect }) => {
        // The other convention: name the bag rather than each property
        const code =
            "/**\n * Formats it.\n * @param nitpick The triplet.\n * @returns The text.\n */\nfunction format({ problem, why, fix }: Nitpick): string {\n    return problem + why + fix\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should still report a destructured object with no @param at all", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Sends it.\n */\nasync function send({ user, url }) {}")).toHaveLength(2)
    })

    test("It should not let a whole-object name be claimed by another parameter", ({ expect }) => {
        // "id" documents the first parameter, so it cannot also stand for the object
        const code = "/**\n * Sends it.\n * @param id The id.\n */\nasync function send(id, { user, url }) {}"
        expect(lintRule(RULE, code)).toHaveLength(2)
    })

    test("It should skip an array pattern parameter as too ambiguous", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n */\nasync function run([a, b]) {}")).toHaveLength(0)
    })

    test("It should expect the name behind a default value", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n */\nasync function run(limit = 10) {}")).toHaveLength(1)
        const ok = "/**\n * Runs.\n * @param limit The cap.\n */\nasync function run(limit = 10) {}"
        expect(lintRule(RULE, ok)).toHaveLength(0)
    })

    test("It should expect the name of a rest parameter", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n */\nasync function run(...args) {}")).toHaveLength(1)
        const ok = "/**\n * Runs.\n * @param args The args.\n */\nasync function run(...args) {}"
        expect(lintRule(RULE, ok)).toHaveLength(0)
    })

    // Accepted @param spellings
    test("It should accept a typed @param", ({ expect }) => {
        const code = "/**\n * Runs.\n * @param {string} name The name.\n */\nasync function run(name) {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should accept an optional @param in brackets", ({ expect }) => {
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @param [name] The name.\n */\nasync function run(name) {}"),
        ).toHaveLength(0)
        const withDefault = "/**\n * Runs.\n * @param [name=x] The name.\n */\nasync function run(name) {}"
        expect(lintRule(RULE, withDefault)).toHaveLength(0)
    })

    test("It should count a dotted member @param as documenting its root", ({ expect }) => {
        const code =
            "/**\n * Runs.\n * @param input The input.\n * @param input.id The id.\n */\nasync function run(input) {}"
        expect(lintRule(RULE, code)).toHaveLength(0)

        const rootOnlyViaMember = "/**\n * Runs.\n * @param input.id The id.\n */\nasync function run(input) {}"
        expect(lintRule(RULE, rootOnlyViaMember)).toHaveLength(0)
    })

    // @returns
    test("It should report a value-returning function with no @returns", ({ expect }) => {
        const code = "/**\n * Runs.\n */\nfunction run() {\n    return 1\n}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingReturns")
    })

    test("It should accept the singular @return spelling", ({ expect }) => {
        expect(
            lintRule(RULE, "/**\n * Runs.\n * @return The id.\n */\nfunction run() {\n    return 1\n}"),
        ).toHaveLength(0)
    })

    test("It should not require @returns on a `: void` function", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n */\nfunction run(): void {\n    doThing()\n}")).toHaveLength(0)
    })

    test("It should not require @returns on a `Promise<void>` function", ({ expect }) => {
        const code =
            "/**\n * Runs.\n * @param id The id.\n */\nasync function run(id: string): Promise<void> {\n    await go(id)\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not require @returns on a body that never returns a value", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n */\nfunction run() {\n    doThing()\n}")).toHaveLength(0)
        expect(lintRule(RULE, "/**\n * Runs.\n */\nfunction run() {\n    if (x) return\n}")).toHaveLength(0)
    })

    test("It should require @returns on an arrow with an expression body", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n */\nconst run = () => 1")).toHaveLength(1)
    })

    test("It should not let a nested function's return require an @returns", ({ expect }) => {
        const code = "/**\n * Runs.\n */\nfunction run() {\n    const inner = () => 1\n    use(inner)\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not require @returns on a component returning JSX", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * The card.\n */\nfunction Card() {\n    return <div />\n}", TSX)).toHaveLength(0)
    })

    // Where the JSDoc lives
    test("It should check a documented class method", ({ expect }) => {
        const code = "class A {\n    /**\n     * Runs.\n     */\n    run(id: string): void {\n        go(id)\n    }\n}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingParam")
    })

    test("It should check a documented object-literal method", ({ expect }) => {
        const code =
            "const adapter = {\n    /**\n     * Ends the turn.\n     */\n    async endTurn(turnId: string): Promise<void> {\n        await go(turnId)\n    },\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should check a documented object-literal arrow property", ({ expect }) => {
        const code =
            "const o = {\n    /**\n     * Runs.\n     */\n    run: (id: string): void => {\n        go(id)\n    },\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should check a documented arrow assigned to a const", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n */\nconst run = (id: string): void => {\n    go(id)\n}")).toHaveLength(1)
    })

    test("It should check a documented exported function", ({ expect }) => {
        const code = "/**\n * Runs.\n */\nexport function run(id: string): void {\n    go(id)\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should check a function documented above an ignore directive", ({ expect }) => {
        const code =
            "/**\n * Sends it.\n */\n// biome-ignore lint/suspicious/useAwait: timing\nexport async function send(user): Promise<void> {}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should handle the real-world adapter shape", ({ expect }) => {
        const code = [
            "/**",
            " * Builds the adapter.",
            " * @param headers The credential.",
            " * @returns The adapter.",
            " */",
            "export function createPlatformAdapter(headers: Record<string, string>) {",
            "    return {",
            "        /**",
            "         * Opens the session.",
            "         * @param input The input.",
            "         * @returns The turn.",
            "         */",
            "        async beginTurn(input: BeginTurnInput): Promise<PersistedTurnRef> {",
            "            return open(input, headers)",
            "        },",
            "        /**",
            "         * Writes the text so far.",
            "         * @param turnId The turn id.",
            "         * @param content The content.",
            "         */",
            "        async appendContent(turnId: string, content: string): Promise<void> {",
            "            await update(turnId, content, headers)",
            "        },",
            "    }",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in both messages", ({ expect }) => {
        const param = lintRule(RULE, "/**\n * Runs.\n */\nasync function run(id) {}")
        expect(param[0]?.message).toContain("why:")
        expect(param[0]?.message).toContain("fix:")

        const returns = lintRule(RULE, "/**\n * Runs.\n */\nfunction run() {\n    return 1\n}")
        expect(returns[0]?.message).toContain("why:")
        expect(returns[0]?.message).toContain("fix:")
    })
})
