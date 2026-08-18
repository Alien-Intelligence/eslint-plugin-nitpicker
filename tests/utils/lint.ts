import * as tsParser from "@typescript-eslint/parser"
import type { ESLint, Linter as ESLinter } from "eslint"
import { Linter } from "eslint"
import plugin from "@/index"
import CONSTANTS from "@/lib/constants"

/**
 * Extra knobs for a single lint run, shared by every rule test.
 */
export type LintOptions = {
    /**
     * Rule options passed after the severity.
     */
    options?: readonly unknown[]

    /**
     * Shared config settings, e.g. `{ nitpicker: { react: true } }`.
     */
    settings?: Record<string, unknown>

    /**
     * The filename to lint as, controlling extension-based detection.
     */
    filename?: string
}

// A filename is always supplied so the config "files" glob matches the run
const DEFAULT_FILENAME = "file.ts"

/**
 * Builds the single-rule flat config used by every lint run.
 * @param ruleName The kebab-case rule name (without the plugin prefix).
 * @param opts The lint options for this run.
 * @returns The flat config array to pass to the linter.
 */
function configFor(ruleName: string, opts: LintOptions): ESLinter.Config[] {
    const ruleId = `${CONSTANTS.PLUGIN_NAME}/${ruleName}`
    const ruleEntry = (
        opts.options && opts.options.length > 0 ? ["error", ...opts.options] : "error"
    ) as ESLinter.RuleEntry

    return [
        {
            files: ["**/*.ts", "**/*.tsx"],
            languageOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                parser: tsParser as unknown as ESLinter.Parser,
                parserOptions: { ecmaFeatures: { jsx: true } },
            },
            plugins: { [CONSTANTS.PLUGIN_NAME]: plugin as unknown as ESLint.Plugin },
            settings: opts.settings ?? {},
            rules: { [ruleId]: ruleEntry },
        },
    ]
}

/**
 * Lints a snippet of code with a single Nitpicker rule enabled and returns the
 * resulting lint messages.
 * @param ruleName The kebab-case rule name (without the plugin prefix).
 * @param code The source code to lint.
 * @param opts Optional rule options, settings, and filename.
 * @returns The lint messages produced by the rule.
 */
export function lintRule(ruleName: string, code: string, opts: LintOptions = {}): ESLinter.LintMessage[] {
    const linter = new Linter()

    return linter.verify(code, configFor(ruleName, opts), opts.filename ?? DEFAULT_FILENAME)
}

/**
 * Lints a snippet of code with a single Nitpicker rule enabled, applies its
 * autofixes, and returns the resulting fixed source.
 * @param ruleName The kebab-case rule name (without the plugin prefix).
 * @param code The source code to lint and fix.
 * @param opts Optional rule options, settings, and filename.
 * @returns The source code after applying the rule's fixes.
 */
export function fixRule(ruleName: string, code: string, opts: LintOptions = {}): string {
    const linter = new Linter()
    const { output } = linter.verifyAndFix(code, configFor(ruleName, opts), opts.filename ?? DEFAULT_FILENAME)

    return output
}
