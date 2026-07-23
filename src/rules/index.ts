import type { TSESLint } from "@typescript-eslint/utils"
import type { NitpickerRuleDocs } from "@/lib/utils/createRule"
import noDecorativeCommentSeparators from "@/rules/base/noDecorativeCommentSeparators"
import noEmDash from "@/rules/base/noEmDash"
import noJSDocBlankBeforeTags from "@/rules/base/noJSDocBlankBeforeTags"
import noLineCommentPeriod from "@/rules/base/noLineCommentPeriod"
import noPropertyAccessAlias from "@/rules/base/noPropertyAccessAlias"
import noSingleLineJSDoc from "@/rules/base/noSingleLineJSDoc"
import requireFrameworkConfig from "@/rules/base/requireFrameworkConfig"
import requireFunctionJSDoc from "@/rules/base/requireFunctionJSDoc"

/**
 * Every rule instance registered by the plugin.
 */
const ruleInstances = [
    noDecorativeCommentSeparators,
    noEmDash,
    noJSDocBlankBeforeTags,
    noLineCommentPeriod,
    noPropertyAccessAlias,
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
