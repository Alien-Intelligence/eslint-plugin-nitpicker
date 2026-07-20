import type { ESLint, Linter as ESLinter } from "eslint"
import { Linter } from "eslint"
import { describe, test } from "vitest"
import plugin from "@/index"

const RULE_ID = "nitpicker/require-framework-config"

type LintOptions = {
    settings?: Record<string, unknown>
    filename?: string
    options?: unknown[]
}

/**
 * Lints code with only `require-framework-config` enabled, allowing custom
 * settings, a filename (for extension-based detection), and rule options.
 * @param code The code to lint.
 * @param opts The linting options.
 * @returns The linting messages.
 */
function lint(code: string, opts: LintOptions = {}): ESLinter.LintMessage[] {
    const linter = new Linter()

    return linter.verify(
        code,
        [
            {
                languageOptions: {
                    ecmaVersion: "latest",
                    sourceType: "module",
                    parserOptions: { ecmaFeatures: { jsx: true } },
                },
                plugins: { nitpicker: plugin as unknown as ESLint.Plugin },
                settings: opts.settings ?? {},
                rules: { [RULE_ID]: opts.options ? ["error", ...opts.options] : "error" },
            },
        ],
        opts.filename,
    )
}

describe("require-framework-config", () => {
    test("It should not report a plain file that uses no framework", ({ expect }) => {
        const messages = lint("export const a = 1")
        expect(messages).toHaveLength(0)
    })

    test("It should report an AdonisJS file when the config is not enabled", ({ expect }) => {
        const messages = lint('import User from "#models/user"')
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingConfig")
    })

    test("It should report a `@adonisjs/*` import when the config is not enabled", ({ expect }) => {
        const messages = lint('import router from "@adonisjs/core/services/router"')
        expect(messages).toHaveLength(1)
    })

    test("It should not report an AdonisJS file when the config is enabled", ({ expect }) => {
        const messages = lint('import User from "#models/user"', { settings: { nitpicker: { adonisjs: true } } })
        expect(messages).toHaveLength(0)
    })

    test("It should report a React import when the config is not enabled", ({ expect }) => {
        const messages = lint('import { useState } from "react"')
        expect(messages).toHaveLength(1)
    })

    test("It should report a .tsx file even with no React import", ({ expect }) => {
        const messages = lint("export const a = 1", { filename: "Component.tsx" })
        expect(messages).toHaveLength(1)
    })

    test("It should not report a React file when the config is enabled", ({ expect }) => {
        const messages = lint('import { useState } from "react"', { settings: { nitpicker: { react: true } } })
        expect(messages).toHaveLength(0)
    })

    test("It should not report a framework listed in the ignore option", ({ expect }) => {
        const messages = lint('import User from "#models/user"', { options: [{ ignore: ["adonisjs"] }] })
        expect(messages).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lint('import { useState } from "react"')
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
