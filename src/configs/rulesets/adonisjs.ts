import type { TSESLint } from "@typescript-eslint/utils"
import { categoryRules } from "@/configs/helpers"
import CONSTANTS from "@/lib/constants"

// AdonisJS route files where banner separators are the clearest way to group routes
const ROUTE_FILE_GLOBS = ["**/start/routes.ts", "**/start/routes/**/*.ts"]

/**
 * Builds the `adonisjs` flat config: AdonisJS-specific rules, plus a settings
 * flag so `require-framework-config` knows AdonisJS is opted into for these files.
 * It also permits decorative banners in route files, where they aid readability.
 * @param plugin The plugin instance to register the rules against.
 * @returns The flat config object.
 */
export function adonisjs(plugin: TSESLint.FlatConfig.Plugin): TSESLint.FlatConfig.Config {
    return {
        name: `${CONSTANTS.PLUGIN_NAME}/adonisjs`,
        plugins: { [CONSTANTS.PLUGIN_NAME]: plugin },
        settings: { [CONSTANTS.PLUGIN_NAME]: { adonisjs: true } },
        rules: {
            ...categoryRules("adonisjs"),
            [`${CONSTANTS.PLUGIN_NAME}/no-decorative-comment-separators`]: ["warn", { allowIn: ROUTE_FILE_GLOBS }],
        },
    }
}
