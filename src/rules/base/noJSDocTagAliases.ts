import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { getJSDocTags, isJSDocComment } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "alias"

/**
 * Flags a JSDoc tag written with one of its synonyms (`@return`, `@arg`,
 * `@exception`, ...) and renames it to the canonical spelling, so one codebase
 * never mixes two names for the same tag.
 */
class NoJSDocTagAliases extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-jsdoc-tag-aliases"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow JSDoc tag synonyms such as `@return`; use the canonical `@returns`.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            alias: nitpick({
                problem: "The JSDoc tag `@{{alias}}` is a synonym of `@{{canonical}}`.",
                why: "Two spellings of one tag make the docs inconsistent and harder to search, so one is canonical",
                fix: "Rename it to `@{{canonical}}`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (!isJSDocComment(comment)) continue

                    for (const tag of getJSDocTags(comment)) {
                        const canonical = CONSTANTS.JSDOC.TAG_ALIASES.get(tag.name)
                        if (canonical === undefined) continue

                        // The name starts right after the "@"
                        const start = tag.index + 1
                        const end = start + tag.name.length

                        context.report({
                            loc: {
                                start: context.sourceCode.getLocFromIndex(tag.index),
                                end: context.sourceCode.getLocFromIndex(end),
                            },
                            messageId: "alias",
                            data: {
                                alias: tag.name,
                                canonical,
                            },
                            fix: fixer => fixer.replaceTextRange([start, end], canonical),
                        })
                    }
                }
            },
        }
    }
}

export default new NoJSDocTagAliases()
