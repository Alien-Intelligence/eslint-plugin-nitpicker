import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-framework-config"

describe("require-framework-config", () => {
    test("It should not report a plain file that uses no framework", ({ expect }) => {
        const messages = lintRule(RULE, "export const a = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should report an AdonisJS file when the config is not enabled", ({ expect }) => {
        const messages = lintRule(RULE, 'import User from "#models/user"')
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingConfig")
    })

    test("It should report a `@adonisjs/*` import when the config is not enabled", ({ expect }) => {
        const messages = lintRule(RULE, 'import router from "@adonisjs/core/services/router"')
        expect(messages).toHaveLength(1)
    })

    test("It should not report an AdonisJS file when the config is enabled", ({ expect }) => {
        const messages = lintRule(RULE, 'import User from "#models/user"', {
            settings: { nitpicker: { adonisjs: true } },
        })
        expect(messages).toHaveLength(0)
    })

    test("It should report a React import when the config is not enabled", ({ expect }) => {
        const messages = lintRule(RULE, 'import { useState } from "react"')
        expect(messages).toHaveLength(1)
    })

    test("It should report a .tsx file even with no React import", ({ expect }) => {
        const messages = lintRule(RULE, "export const a = 1", { filename: "Component.tsx" })
        expect(messages).toHaveLength(1)
    })

    test("It should not report a React file when the config is enabled", ({ expect }) => {
        const messages = lintRule(RULE, 'import { useState } from "react"', {
            settings: { nitpicker: { react: true } },
        })
        expect(messages).toHaveLength(0)
    })

    test("It should not report a framework listed in the ignore option", ({ expect }) => {
        const messages = lintRule(RULE, 'import User from "#models/user"', { options: [{ ignore: ["adonisjs"] }] })
        expect(messages).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, 'import { useState } from "react"')
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
