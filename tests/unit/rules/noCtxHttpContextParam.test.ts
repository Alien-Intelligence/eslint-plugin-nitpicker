import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-ctx-httpcontext-param"

describe("no-ctx-httpcontext-param", () => {
    test("It should report a handler binding the context whole", ({ expect }) => {
        const code = "class A {\n    async store(ctx: HttpContext) {\n        return ctx.request.all()\n    }\n}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-ctx-httpcontext-param")
        expect(messages[0]?.messageId).toBe("wholeContext")
    })

    test("It should report whatever the parameter is named", ({ expect }) => {
        const messages = lintRule(RULE, "async function store(context: HttpContext) {}")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.message).toContain("context")
    })

    test("It should not report a destructured context", ({ expect }) => {
        expect(lintRule(RULE, "async function store({ auth, request }: HttpContext) {}")).toHaveLength(0)
        expect(lintRule(RULE, "async function store({ request, ...rest }: HttpContext) {}")).toHaveLength(0)
    })

    // The convention is absolute, middleware and exception handlers destructure too
    test("It should report a middleware handle signature", ({ expect }) => {
        const code = "class Mw {\n    async handle(ctx: HttpContext, next: NextFn) {\n        await next()\n    }\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report the context wherever it sits in the signature", ({ expect }) => {
        const code =
            "class H {\n    async handle(error: unknown, ctx: HttpContext) {\n        log(error, ctx)\n    }\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a destructured middleware signature", ({ expect }) => {
        const code =
            "class Mw {\n    async handle({ request }: HttpContext, next: NextFn) {\n        await next()\n    }\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report an arrow route handler", ({ expect }) => {
        expect(lintRule(RULE, "const show = (ctx: HttpContext) => ctx.response.ok({})")).toHaveLength(1)
    })

    test("It should report a constructor property taking the context", ({ expect }) => {
        const code = "class S {\n    constructor(private ctx: HttpContext) {}\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a parameter of another type named ctx", ({ expect }) => {
        expect(lintRule(RULE, "async function run(ctx: AuditContext) {}")).toHaveLength(0)
        expect(lintRule(RULE, "async function run(ctx) {}")).toHaveLength(0)
    })

    test("It should not report in a file matched by allowIn", ({ expect }) => {
        const opts = { options: [{ allowIn: ["**/exceptions/*.ts"] }], filename: "app/exceptions/handler.ts" }
        expect(lintRule(RULE, "async function handle(ctx: HttpContext) {}", opts)).toHaveLength(0)
    })

    test("It should still report outside the allowIn globs", ({ expect }) => {
        const opts = { options: [{ allowIn: ["**/exceptions/*.ts"] }], filename: "app/controllers/users.ts" }
        expect(lintRule(RULE, "async function handle(ctx: HttpContext) {}", opts)).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "async function store(ctx: HttpContext) {}")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
