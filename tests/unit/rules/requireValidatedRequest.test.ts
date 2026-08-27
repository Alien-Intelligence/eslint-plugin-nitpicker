import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-validated-request"

describe("require-validated-request", () => {
    test("It should report request.qs()", ({ expect }) => {
        const messages = lintRule(RULE, "const q = request.qs()")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-validated-request")
        expect(messages[0]?.messageId).toBe("rawRead")
    })

    test("It should report request.input, body, and all", ({ expect }) => {
        expect(lintRule(RULE, 'const a = request.input("x")')).toHaveLength(1)
        expect(lintRule(RULE, "const b = request.body()")).toHaveLength(1)
        expect(lintRule(RULE, "const c = request.all()")).toHaveLength(1)
    })

    test("It should report a raw read reached through ctx.request", ({ expect }) => {
        expect(lintRule(RULE, "const q = ctx.request.qs()")).toHaveLength(1)
        expect(lintRule(RULE, "const q = this.ctx.request.input()")).toHaveLength(1)
    })

    test("It should not report request.validateUsing", ({ expect }) => {
        expect(lintRule(RULE, "const data = request.validateUsing(createValidator)")).toHaveLength(0)
    })

    test("It should not report legitimate accessors like params or header", ({ expect }) => {
        expect(lintRule(RULE, "const id = request.params()")).toHaveLength(0)
        expect(lintRule(RULE, 'const h = request.header("x-key")')).toHaveLength(0)
    })

    test("It should not report a raw read in a file matched by allowIn", ({ expect }) => {
        const opts = { options: [{ allowIn: ["**/*_proxy_controller.ts"] }], filename: "cluster_proxy_controller.ts" }
        expect(lintRule(RULE, "const q = request.qs()", opts)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const q = request.qs()")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
