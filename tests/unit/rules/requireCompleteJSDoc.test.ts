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

    // An underscore-prefixed name is the convention for a deliberately unused
    // binding, the same one catch-error-name mandates for "_error"
    test("It should skip an underscore-prefixed parameter", ({ expect }) => {
        const code =
            "/**\n * Handles it.\n * @param state The state.\n */\nfunction onEvent(_: unknown, state: string) {}"
        expect(lintRule(RULE, code)).toHaveLength(0)

        const named = "/**\n * Handles it.\n * @param state The state.\n */\nfunction onEvent(_event, state) {}"
        expect(lintRule(RULE, named)).toHaveLength(0)
    })

    test("It should still accept an underscore parameter that is documented anyway", ({ expect }) => {
        const code =
            "/**\n * Handles it.\n * @param _ The event, unused.\n * @param state The state.\n */\nfunction onEvent(_, state) {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should skip an underscore-prefixed destructured property", ({ expect }) => {
        const code = "/**\n * Runs.\n * @param user The user.\n */\nasync function run({ user, _internal }) {}"
        expect(lintRule(RULE, code)).toHaveLength(0)
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
        expect(lintRule(RULE, "/**\n * Runs.\n */\nconst run = () => ({ a: 1 })")).toHaveLength(1)
    })

    // A forwarded call is opaque, so the brace style must not decide whether a
    // "@returns" is owed, which is what no-jsdoc-returns-on-void objects to
    test("It should not require @returns on a concise arrow forwarding a call", ({ expect }) => {
        expect(lintRule(RULE, "/**\n * Runs.\n */\nconst run = () => doVoidThing()")).toHaveLength(0)
        expect(lintRule(RULE, "/**\n * Runs.\n */\nconst run = async () => await doVoidThing()")).toHaveLength(0)
    })

    test("It should still require @returns when a return type says a value comes back", ({ expect }) => {
        const code = "/**\n * Runs.\n */\nconst run = (): string => doThing()"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingReturns")
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

    // AdonisJS route handlers, documented route-first
    test("It should not require @param for a destructured HttpContext", ({ expect }) => {
        const code =
            "class C {\n    /**\n     * POST /users\n     */\n    async store({ auth, request, params }: HttpContext) {\n        return this.ok()\n    }\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not require @returns on a route handler", ({ expect }) => {
        const code =
            "class C {\n    /**\n     * GET /users/:id\n     */\n    async show({ params }: HttpContext) {\n        return this.successResponse(params.id)\n    }\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should still require @param for a context bound whole", ({ expect }) => {
        // "ctx: HttpContext" is its own violation, no-ctx-httpcontext-param owns it
        const code =
            "class C {\n    /**\n     * POST /users\n     */\n    async store(ctx: HttpContext) {\n        return this.ok()\n    }\n}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingParam")
    })

    test("It should still require @param for a handler's non-context parameters", ({ expect }) => {
        const code =
            "class C {\n    /**\n     * POST /users\n     */\n    async store({ request }: HttpContext, retries: number) {\n        return this.ok(retries)\n    }\n}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingParam")
    })

    test("It should not exempt a destructured parameter of another type", ({ expect }) => {
        const code = "/**\n * Runs.\n */\nasync function run({ auth, request }: AuditContext) {}"
        expect(lintRule(RULE, code)).toHaveLength(2)
    })

    test("It should not let the context exemption hide an undocumented sibling object", ({ expect }) => {
        const code =
            "class C {\n    /**\n     * POST /users\n     */\n    async store({ request }: HttpContext, { limit }: Options) {\n        return this.ok(limit)\n    }\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
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
