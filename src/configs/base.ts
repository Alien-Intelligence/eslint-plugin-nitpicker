import type { TSESLint } from "@typescript-eslint/utils"
import { categoryRules } from "@/configs/helpers"
import CONSTANTS from "@/lib/constants"

/**
 * Builds the `base` flat config: the universal rules that apply to every file
 * regardless of framework.
 * @param plugin The plugin instance to register the rules against.
 * @returns The flat config object.
 */
export function base(plugin: TSESLint.FlatConfig.Plugin): TSESLint.FlatConfig.Config {
    return {
        name: `${CONSTANTS.PLUGIN_NAME}/base`,
        plugins: { [CONSTANTS.PLUGIN_NAME]: plugin },
        rules: categoryRules("base"),
    }
}
