import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-relative-imports"

describe("no-relative-imports", () => {
    test("It should report a same-directory relative import", ({ expect }) => {
        const messages = lintRule(RULE, 'import { a } from "./sibling"')
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-relative-imports")
        expect(messages[0]?.messageId).toBe("relative")
    })

    test("It should report a parent-directory relative import", ({ expect }) => {
        expect(lintRule(RULE, 'import a from "../lib/thing"')).toHaveLength(1)
    })

    test("It should not report an alias import", ({ expect }) => {
        expect(lintRule(RULE, 'import a from "#models/user"')).toHaveLength(0)
        expect(lintRule(RULE, 'import a from "@frontend/components/grid"')).toHaveLength(0)
    })

    test("It should not report a bare package import", ({ expect }) => {
        expect(lintRule(RULE, 'import { useMemo } from "react"')).toHaveLength(0)
    })

    test("It should report a relative re-export", ({ expect }) => {
        expect(lintRule(RULE, 'export { a } from "./sibling"')).toHaveLength(1)
        expect(lintRule(RULE, 'export * from "../shared"')).toHaveLength(1)
    })

    test("It should report a relative dynamic import", ({ expect }) => {
        expect(lintRule(RULE, 'const load = () => import("./controller")')).toHaveLength(1)
    })

    test("It should not report anything in a file matched by allowIn", ({ expect }) => {
        const opts = { options: [{ allowIn: ["**/bin/*.ts"] }], filename: "bin/console.ts" }
        expect(lintRule(RULE, 'import a from "./setup"', opts)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, 'import a from "./x"')
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
