import type { TSESLint } from "@typescript-eslint/utils"
import { adonisjs } from "@/configs/adonisjs"
import { all } from "@/configs/all"
import { base } from "@/configs/base"
import { react } from "@/configs/react"
import { recommended } from "@/configs/recommended"

/**
 * Builds all shared configs bundled with the plugin.
 *
 * Note: Configs are built from a factory rather than declared statically
 * because each one needs a reference to the plugin instance it belongs to.
 * @param plugin The plugin instance to register the rules against.
 * @returns A record of config name to flat config object.
 */
export function buildConfigs(plugin: TSESLint.FlatConfig.Plugin): Record<string, TSESLint.FlatConfig.Config> {
    return {
        base: base(plugin),
        recommended: recommended(plugin),
        adonisjs: adonisjs(plugin),
        react: react(plugin),
        all: all(plugin),
    }
}
