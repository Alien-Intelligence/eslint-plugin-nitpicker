import type { ESLint, Linter as ESLinter } from "eslint"
import { Linter } from "eslint"
import plugin from "@/index"
import CONSTANTS from "@/lib/constants"

/**
 * Lints a snippet of code with a single Nitpicker rule enabled and returns the
 * resulting lint messages.
 * @param ruleName The kebab-case rule name (without the plugin prefix).
 * @param code The source code to lint.
 * @param options Optional rule options passed after the severity.
 * @returns The lint messages produced by the rule.
 */
export function lintRule(ruleName: string, code: string, ...options: unknown[]): ESLinter.LintMessage[] {
    const linter = new Linter()
    const ruleId = `${CONSTANTS.PLUGIN_NAME}/${ruleName}`

    return linter.verify(code, [
        {
            plugins: { [CONSTANTS.PLUGIN_NAME]: plugin as unknown as ESLint.Plugin },
            rules: {
                [ruleId]: options.length > 0 ? ["error", ...options] : "error",
            },
        },
    ])
}

/**
 * Lints a snippet of code with a single Nitpicker rule enabled, applies its
 * autofixes, and returns the resulting fixed source.
 * @param ruleName The kebab-case rule name (without the plugin prefix).
 * @param code The source code to lint and fix.
 * @param options Optional rule options passed after the severity.
 * @returns The source code after applying the rule's fixes.
 */
export function fixRule(ruleName: string, code: string, ...options: unknown[]): string {
    const linter = new Linter()
    const ruleId = `${CONSTANTS.PLUGIN_NAME}/${ruleName}`

    const { output } = linter.verifyAndFix(code, [
        {
            plugins: { [CONSTANTS.PLUGIN_NAME]: plugin as unknown as ESLint.Plugin },
            rules: {
                [ruleId]: options.length > 0 ? ["error", ...options] : "error",
            },
        },
    ])

    return output
}
