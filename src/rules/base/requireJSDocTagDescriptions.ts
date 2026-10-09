import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { getJSDocTagParts, getJSDocTags, isJSDocComment } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "missingDescription"

/**
 * Requires every `@param` and `@returns` tag to describe its value, so a tag
 * never stops at a bare name or type that only restates the signature.
 */
class RequireJSDocTagDescriptions extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-jsdoc-tag-descriptions"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require every JSDoc `@param` and `@returns` tag to carry a description.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            missingDescription: nitpick({
                problem: "The JSDoc tag `{{tag}}` has no description.",
                why: "A bare name or type only restates the signature, the reader still has to guess what the value means",
                fix: "Describe the value after the tag, e.g. `@param url The link the request is sent to`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (!isJSDocComment(comment)) continue

                    const tags = getJSDocTags(comment).filter(tag => CONSTANTS.JSDOC.DESCRIBED_TAGS.has(tag.name))
                    const parts = tags.map(getJSDocTagParts)

                    for (const [index, tag] of tags.entries()) {
                        const { name, description } = parts[index] ?? { name: null, description: "" }
                        if (description !== "") continue

                        // A parent object documented through its members, e.g. a bare
                        // "@param options" above "@param options.id The id"
                        if (name !== null && parts.some(part => part.name?.startsWith(`${name}.`))) continue

                        context.report({
                            loc: {
                                start: context.sourceCode.getLocFromIndex(tag.index),
                                end: context.sourceCode.getLocFromIndex(tag.lineEnd),
                            },
                            messageId: "missingDescription",
                            data: { tag: name === null ? `@${tag.name}` : `@${tag.name} ${name}` },
                        })
                    }
                }
            },
        }
    }
}

export default new RequireJSDocTagDescriptions()
