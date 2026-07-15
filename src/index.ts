import type { TSESLint } from "@typescript-eslint/utils"
import { buildConfigs } from "@/configs"
import CONSTANTS from "@/lib/constants"
import { rules } from "@/rules"
import { version } from "../package.json"

/**
 * The `@the-alien-club/eslint-plugin-nitpicker` plugin.
 *
 * A hyper-pedantic ESLint plugin that flags every stylistic and semantic nit,
 * with AI-friendly fix context baked into each message.
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
