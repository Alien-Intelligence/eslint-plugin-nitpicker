import { ESLintUtils } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"

/**
 * The category a rule belongs to, which decides the shared config it ships in,
 * `base` rules are universal, framework categories only apply when the consumer
 * opts into the matching config.
 */
export type RuleCategory = "base" | "adonisjs" | "react"

/**
 * Extra metadata attached to every Nitpicker rule under `meta.docs`.
 */
export type NitpickerRuleDocs = {
    /**
     * A short, human-readable description of what the rule enforces.
     */
    description: string

    /**
     * Whether the rule is part of the `recommended` shared config.
     */
    recommended?: boolean

    /**
     * The category the rule belongs to, defaults to `base` when omitted.
     */
    category?: RuleCategory
}

/**
 * The shared rule factory for the whole plugin.
 *
 * It wires up strong typing for a rule's options and message IDs, and points
 * every rule at its documentation page on GitHub.
 */
export const createRule = ESLintUtils.RuleCreator<NitpickerRuleDocs>(
    name => `${CONSTANTS.REPO_URL}/blob/main/docs/rules/${name}.md`,
)
