import type { TSESLint } from "@typescript-eslint/utils"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

import migrationTableOrder from "@/rules/adonisjs/migrationTableOrder"
import requireControllerJSDoc from "@/rules/adonisjs/requireControllerJSDoc"
import requireMigrationJSDoc from "@/rules/adonisjs/requireMigrationJSDoc"
import maxJSDocDescriptionLength from "@/rules/base/maxJSDocDescriptionLength"
import noAliasVariables from "@/rules/base/noAliasVariables"
import noBritishEnglish from "@/rules/base/noBritishEnglish"
import noDecorativeCommentSeparators from "@/rules/base/noDecorativeCommentSeparators"
import noEmDash from "@/rules/base/noEmDash"
import noEmojis from "@/rules/base/noEmojis"
import noJSDocBlankBeforeTags from "@/rules/base/noJSDocBlankBeforeTags"
import noJSDocReturnsOnVoid from "@/rules/base/noJSDocReturnsOnVoid"
import noLineCommentPeriod from "@/rules/base/noLineCommentPeriod"
import noPropertyAccessAlias from "@/rules/base/noPropertyAccessAlias"
import noPropertyDestructuring from "@/rules/base/noPropertyDestructuring"
import noSingleLineJSDoc from "@/rules/base/noSingleLineJSDoc"
import requireFrameworkConfig from "@/rules/base/requireFrameworkConfig"
import requireFunctionJSDoc from "@/rules/base/requireFunctionJSDoc"
import requireMultilineObject from "@/rules/base/requireMultilineObject"
import requireContextHookDestructure from "@/rules/react/requireContextHookDestructure"
import requireHookObjectReturn from "@/rules/react/requireHookObjectReturn"

/**
 * Every rule instance registered by the plugin.
 */
const ruleInstances = [
    migrationTableOrder,
    requireControllerJSDoc,
    requireMigrationJSDoc,
    maxJSDocDescriptionLength,
    noAliasVariables,
    noBritishEnglish,
    noDecorativeCommentSeparators,
    noEmDash,
    noEmojis,
    noJSDocBlankBeforeTags,
    noJSDocReturnsOnVoid,
    noLineCommentPeriod,
    noPropertyAccessAlias,
    noPropertyDestructuring,
    noSingleLineJSDoc,
    requireFrameworkConfig,
    requireFunctionJSDoc,
    requireMultilineObject,
    requireContextHookDestructure,
    requireHookObjectReturn,
]

/**
 * The plugin's rules, keyed by name, as the plain modules ESLint consumes.
 */
export const rules = Object.fromEntries(ruleInstances.map(rule => [rule.name, rule.toRuleModule()])) as Record<
    string,
    TSESLint.RuleModule<string, readonly unknown[], NitpickerRuleDocs>
>
