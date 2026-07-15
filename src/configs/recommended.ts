import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { rules } from "@/rules"

/**
 * Builds the `recommended` flat config: the curated subset of rules marked as
 * recommended, each enabled as a warning.
 * @param plugin The plugin instance to register the rules against.
 * @returns The flat config object.
 */
export function recommended(plugin: TSESLint.FlatConfig.Plugin): TSESLint.FlatConfig.Config {
    const enabled: TSESLint.FlatConfig.Rules = {}

    for (const [name, rule] of Object.entries(rules)) {
        if (rule.meta.docs?.recommended) {
            enabled[`${CONSTANTS.PLUGIN_NAME}/${name}`] = "warn"
        }
    }

    return {
        name: `${CONSTANTS.PLUGIN_NAME}/recommended`,
        plugins: { [CONSTANTS.PLUGIN_NAME]: plugin },
        rules: enabled,
    }
}
