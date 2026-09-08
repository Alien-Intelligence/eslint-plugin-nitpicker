import type { TSESLint } from "@typescript-eslint/utils"
import { categoryRules } from "@/configs/helpers"
import CONSTANTS from "@/lib/constants"

// Scope this to the feature code, excluding the primitive layer itself, where
// wrapping a library and drawing a surface by hand are the correct thing to do
/**
 * Builds the `design` flat config: the design-system rules, opt-in rather than
 * part of `recommended` since they assume a wrapped primitive layer and a token
 * palette that not every project has.
 * @param plugin The plugin instance to register the rules against.
 * @returns The flat config object.
 */
export function design(plugin: TSESLint.FlatConfig.Plugin): TSESLint.FlatConfig.Config {
    return {
        name: `${CONSTANTS.PLUGIN_NAME}/design`,
        plugins: { [CONSTANTS.PLUGIN_NAME]: plugin },
        rules: categoryRules("design"),
    }
}
