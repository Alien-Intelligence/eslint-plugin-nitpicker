import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import type { RuleCategory } from "@/lib/utils/createRule"
import { rules } from "@/rules"

/**
 * Builds the rules record for a single category, each enabled as a warning,
 * rules with no explicit category are treated as `base`.
 * @param category The category to collect rules for.
 * @returns The flat-config rules record for that category.
 */
export function categoryRules(category: RuleCategory): TSESLint.FlatConfig.Rules {
    const enabled: TSESLint.FlatConfig.Rules = {}

    for (const [name, rule] of Object.entries(rules)) {
        if ((rule.meta.docs?.category ?? "base") === category) {
            enabled[`${CONSTANTS.PLUGIN_NAME}/${name}`] = "warn"
        }
    }

    return enabled
}

/**
 * Builds a rules record enabling every rule the plugin ships, as a warning.
 * @returns The flat-config rules record for all rules.
 */
export function allRules(): TSESLint.FlatConfig.Rules {
    const enabled: TSESLint.FlatConfig.Rules = {}

    for (const name of Object.keys(rules)) {
        enabled[`${CONSTANTS.PLUGIN_NAME}/${name}`] = "warn"
    }

    return enabled
}
