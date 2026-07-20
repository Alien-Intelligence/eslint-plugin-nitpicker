import type { TSESLint } from "@typescript-eslint/utils"
import type { NitpickerRuleDocs } from "@/lib/utils/createRule"
import noEmDash from "@/rules/noEmDash"
import noJSDocBlankBeforeTags from "@/rules/noJSDocBlankBeforeTags"
import noLineCommentPeriod from "@/rules/noLineCommentPeriod"
import noSingleLineJSDoc from "@/rules/noSingleLineJSDoc"
import requireFrameworkConfig from "@/rules/requireFrameworkConfig"
import requireFunctionJSDoc from "@/rules/requireFunctionJSDoc"

/**
 * Every rule instance registered by the plugin.
 */
const ruleInstances = [
    noEmDash,
    noJSDocBlankBeforeTags,
    noLineCommentPeriod,
    noSingleLineJSDoc,
    requireFrameworkConfig,
    requireFunctionJSDoc,
]

/**
 * The plugin's rules, keyed by name, as the plain modules ESLint consumes.
 */
export const rules = Object.fromEntries(ruleInstances.map(rule => [rule.name, rule.toRuleModule()])) as Record<
    string,
    TSESLint.RuleModule<string, readonly unknown[], NitpickerRuleDocs>
>
