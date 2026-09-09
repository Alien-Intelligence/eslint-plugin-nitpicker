import type { TSESLint } from "@typescript-eslint/utils"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

import migrationTableOrder from "@/rules/adonisjs/migrationTableOrder"
import requireControllerJSDoc from "@/rules/adonisjs/requireControllerJSDoc"
import requireMigrationJSDoc from "@/rules/adonisjs/requireMigrationJSDoc"
import requireValidatedRequest from "@/rules/adonisjs/requireValidatedRequest"
import catchErrorName from "@/rules/base/catchErrorName"
import maxJSDocDescriptionLength from "@/rules/base/maxJSDocDescriptionLength"
import maxLineCommentLength from "@/rules/base/maxLineCommentLength"
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
import requireCompleteJSDoc from "@/rules/base/requireCompleteJSDoc"
import requireConsistentMemberJSDoc from "@/rules/base/requireConsistentMemberJSDoc"
import requireFrameworkConfig from "@/rules/base/requireFrameworkConfig"
import requireFunctionJSDoc from "@/rules/base/requireFunctionJSDoc"
import requireJSDocDelimiterLines from "@/rules/base/requireJSDocDelimiterLines"
import requireMemberJSDocBlankLine from "@/rules/base/requireMemberJSDocBlankLine"
import requireMultilineObject from "@/rules/base/requireMultilineObject"
import maxConsecutiveStatements from "@/rules/breathing/maxConsecutiveStatements"
import requireBlankBeforeBlock from "@/rules/breathing/requireBlankBeforeBlock"
import requireBlankBeforeReturn from "@/rules/breathing/requireBlankBeforeReturn"
import noArbitraryDimension from "@/rules/design/noArbitraryDimension"
import noCenteredTableColumn from "@/rules/design/noCenteredTableColumn"
import noHandRolledSurface from "@/rules/design/noHandRolledSurface"
import noPaletteBypass from "@/rules/design/noPaletteBypass"
import noRawColor from "@/rules/design/noRawColor"
import noRawControlElement from "@/rules/design/noRawControlElement"
import noUnwrappedPrimitiveImport from "@/rules/design/noUnwrappedPrimitiveImport"
import requireDialogFooter from "@/rules/design/requireDialogFooter"
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
    maxLineCommentLength,
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
    requireCompleteJSDoc,
    requireConsistentMemberJSDoc,
    requireFrameworkConfig,
    requireJSDocDelimiterLines,
    requireMemberJSDocBlankLine,
    requireFunctionJSDoc,
    requireMultilineObject,
    maxConsecutiveStatements,
    requireBlankBeforeBlock,
    requireBlankBeforeReturn,
    noArbitraryDimension,
    noCenteredTableColumn,
    noHandRolledSurface,
    noPaletteBypass,
    noRawColor,
    noRawControlElement,
    noUnwrappedPrimitiveImport,
    requireDialogFooter,
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
