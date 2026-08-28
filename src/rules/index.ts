import type { TSESLint } from "@typescript-eslint/utils"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

import migrationTableOrder from "@/rules/adonisjs/migrationTableOrder"
import requireControllerJSDoc from "@/rules/adonisjs/requireControllerJSDoc"
import requireMigrationJSDoc from "@/rules/adonisjs/requireMigrationJSDoc"
import requireValidatedRequest from "@/rules/adonisjs/requireValidatedRequest"
import catchErrorName from "@/rules/base/catchErrorName"
import maxJSDocDescriptionLength from "@/rules/base/maxJSDocDescriptionLength"
import noAliasVariables from "@/rules/base/noAliasVariables"
import noBritishEnglish from "@/rules/base/noBritishEnglish"
import noDecorativeCommentSeparators from "@/rules/base/noDecorativeCommentSeparators"
import noEmDash from "@/rules/base/noEmDash"
import noEmojis from "@/rules/base/noEmojis"
import noJSDocBlankBeforeTags from "@/rules/base/noJSDocBlankBeforeTags"
import noJSDocReturnsOnVoid from "@/rules/base/noJSDocReturnsOnVoid"
import noLineCommentBackticks from "@/rules/base/noLineCommentBackticks"
import noLineCommentPeriod from "@/rules/base/noLineCommentPeriod"
import noPropertyAccessAlias from "@/rules/base/noPropertyAccessAlias"
import noPropertyDestructuring from "@/rules/base/noPropertyDestructuring"
import noRelativeImports from "@/rules/base/noRelativeImports"
import noSingleLineJSDoc from "@/rules/base/noSingleLineJSDoc"
import requireCapitalizedComments from "@/rules/base/requireCapitalizedComments"
import requireFrameworkConfig from "@/rules/base/requireFrameworkConfig"
import requireFunctionJSDoc from "@/rules/base/requireFunctionJSDoc"
import requireMultilineObject from "@/rules/base/requireMultilineObject"
import maxClassNameLength from "@/rules/react/maxClassNameLength"
import noJSXComments from "@/rules/react/noJSXComments"
import requireContextHookDestructure from "@/rules/react/requireContextHookDestructure"
import requireDerivedUseMemo from "@/rules/react/requireDerivedUseMemo"
import requireHookObjectReturn from "@/rules/react/requireHookObjectReturn"
import requireMemoCallbackJSDoc from "@/rules/react/requireMemoCallbackJSDoc"

/**
 * Every rule instance registered by the plugin.
 */
const ruleInstances = [
    migrationTableOrder,
    requireControllerJSDoc,
    requireMigrationJSDoc,
    requireValidatedRequest,
    catchErrorName,
    maxJSDocDescriptionLength,
    noAliasVariables,
    noBritishEnglish,
    noDecorativeCommentSeparators,
    noEmDash,
    noEmojis,
    noJSDocBlankBeforeTags,
    noJSDocReturnsOnVoid,
    noLineCommentBackticks,
    noLineCommentPeriod,
    noPropertyAccessAlias,
    noPropertyDestructuring,
    noRelativeImports,
    noSingleLineJSDoc,
    requireCapitalizedComments,
    requireFrameworkConfig,
    requireFunctionJSDoc,
    requireMultilineObject,
    maxClassNameLength,
    noJSXComments,
    requireContextHookDestructure,
    requireDerivedUseMemo,
    requireHookObjectReturn,
    requireMemoCallbackJSDoc,
]

/**
 * The plugin's rules, keyed by name, as the plain modules ESLint consumes.
 */
export const rules = Object.fromEntries(ruleInstances.map(rule => [rule.name, rule.toRuleModule()])) as Record<
    string,
    TSESLint.RuleModule<string, readonly unknown[], NitpickerRuleDocs>
>
