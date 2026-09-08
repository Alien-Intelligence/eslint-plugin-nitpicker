import { ESLintUtils } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"

/**
 * The category a rule belongs to, which decides the shared config it ships in.
 */
export type RuleCategory = "base" | "adonisjs" | "react" | "breathing" | "design"

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
 */
export const createRule = ESLintUtils.RuleCreator<NitpickerRuleDocs>(
    () => `${CONSTANTS.REPO_URL}/blob/main/README.md#rules`,
)
