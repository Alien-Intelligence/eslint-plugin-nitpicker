import type { TSESLint } from "@typescript-eslint/utils"
import { categoryRules } from "@/configs/helpers"
import CONSTANTS from "@/lib/constants"

/**
 * Builds the `react` flat config: React-specific rules, plus a settings flag so
 * `require-framework-config` knows React is opted into for these files.
 * @param plugin The plugin instance to register the rules against.
 * @returns The flat config object.
 */
export function react(plugin: TSESLint.FlatConfig.Plugin): TSESLint.FlatConfig.Config {
    return {
        name: `${CONSTANTS.PLUGIN_NAME}/react`,
        plugins: { [CONSTANTS.PLUGIN_NAME]: plugin },
        settings: { [CONSTANTS.PLUGIN_NAME]: { react: true } },
        rules: categoryRules("react"),
    }
}
