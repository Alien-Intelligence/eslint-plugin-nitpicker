import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { rules } from "@/rules"

/**
 * Builds the `all` flat config: every rule the plugin ships, each enabled as a
 * warning, this is the maximally-pedantic Nitpicker experience.
 * @param plugin The plugin instance to register the rules against.
 * @returns The flat config object.
 */
export function all(plugin: TSESLint.FlatConfig.Plugin): TSESLint.FlatConfig.Config {
    const enabled: TSESLint.FlatConfig.Rules = {}

    for (const name of Object.keys(rules)) {
        enabled[`${CONSTANTS.PLUGIN_NAME}/${name}`] = "warn"
    }

    return {
        name: `${CONSTANTS.PLUGIN_NAME}/all`,
        plugins: { [CONSTANTS.PLUGIN_NAME]: plugin },
        rules: enabled,
    }
}
