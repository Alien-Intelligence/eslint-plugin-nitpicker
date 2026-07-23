import type { TSESLint } from "@typescript-eslint/utils"
import { base } from "@/configs/rulesets/base"
import CONSTANTS from "@/lib/constants"

/**
 * Builds the `recommended` flat config: the sensible default for any project,
 * which is the universal `base` ruleset.
 * @param plugin The plugin instance to register the rules against.
 * @returns The flat config object.
 */
export function recommended(plugin: TSESLint.FlatConfig.Plugin): TSESLint.FlatConfig.Config {
    return {
        ...base(plugin),
        name: `${CONSTANTS.PLUGIN_NAME}/recommended`,
    }
}
