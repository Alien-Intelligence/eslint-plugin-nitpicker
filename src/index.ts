import type { TSESLint } from "@typescript-eslint/utils"
import { buildConfigs } from "@/configs"
import CONSTANTS from "@/lib/constants"
import { rules } from "@/rules"

// Import the version from package.json to include in the plugin metadata
import { version } from "../package.json"

/**
 * Main declaration of the `@alien_intelligence/eslint-plugin-nitpicker` plugin.
 */
const plugin: TSESLint.FlatConfig.Plugin = {
    meta: {
        name: `eslint-plugin-${CONSTANTS.PLUGIN_NAME}`,
        version,
    },
    rules,
    configs: {},
}

// Configs reference the plugin, so they are attached after it is created
plugin.configs = buildConfigs(plugin)

export default plugin
