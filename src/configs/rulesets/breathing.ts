import type { TSESLint } from "@typescript-eslint/utils"
import { categoryRules } from "@/configs/helpers"
import CONSTANTS from "@/lib/constants"

/**
 * Builds the `breathing` flat config: the code-spacing rules, which are opt-in
 * rather than part of `recommended` since adopting them rewrites the whitespace
 * of an existing codebase.
 * @param plugin The plugin instance to register the rules against.
 * @returns The flat config object.
 */
export function breathing(plugin: TSESLint.FlatConfig.Plugin): TSESLint.FlatConfig.Config {
    return {
        name: `${CONSTANTS.PLUGIN_NAME}/breathing`,
        plugins: { [CONSTANTS.PLUGIN_NAME]: plugin },
        rules: categoryRules("breathing"),
    }
}
