import { ESLintUtils } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"

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
