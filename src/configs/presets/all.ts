import type { TSESLint } from "@typescript-eslint/utils"
import { allRules } from "@/configs/helpers"
import CONSTANTS from "@/lib/constants"

/**
 * Builds the `all` flat config: every rule the plugin ships, each enabled as a
 * warning, this is the maximally-pedantic Nitpicker experience. Both framework
 * settings flags are set, since enabling everything already opts into them.
 * @param plugin The plugin instance to register the rules against.
 * @returns The flat config object.
 */
export function all(plugin: TSESLint.FlatConfig.Plugin): TSESLint.FlatConfig.Config {
    return {
        name: `${CONSTANTS.PLUGIN_NAME}/all`,
        plugins: { [CONSTANTS.PLUGIN_NAME]: plugin },
        settings: { [CONSTANTS.PLUGIN_NAME]: { adonisjs: true, react: true } },
        rules: allRules(),
    }
}
