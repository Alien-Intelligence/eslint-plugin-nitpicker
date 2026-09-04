import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { getJSDocDescription, isJSDocComment } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ max: number }]
type MessageIds = "tooLong"

/**
 * Flags JSDoc comments whose description (the prose before the first tag) is
 * longer than the configured character limit, catching the oversized,
 * essay-like blocks AI models tend to produce.
 */
class MaxJSDocDescriptionLength extends NitpickerRule<MessageIds, Options> {
    readonly name = "max-jsdoc-description-length"

    readonly defaultOptions: Options = [{ max: CONSTANTS.JSDOC.MAX_DESCRIPTION_LENGTH }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Enforce a maximum character length for a JSDoc description.",
            recommended: true,
            category: "base",
        },
        schema: [
            {
                type: "object",
                properties: {
                    max: { type: "integer", minimum: 1 },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            tooLong: nitpick({
                problem: "This JSDoc description is {{length}} characters, over the {{max}}-character limit.",
                why: "A JSDoc description should summarize what something is, an oversized one usually restates the code or explains how it is used, which does not belong here",
                fix: 'Trim it to a concise summary of what it does, and remove any note about how or where it is used (e.g "used by X to ...", "called from Y"), which is an anti-pattern',
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const max = options[0]?.max ?? CONSTANTS.JSDOC.MAX_DESCRIPTION_LENGTH

        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (!isJSDocComment(comment)) continue

                    const length = getJSDocDescription(comment).length
                    if (length <= max) continue

                    context.report({
                        loc: comment.loc,
                        messageId: "tooLong",
                        data: { length, max },
                    })
                }
            },
        }
    }
}

export default new MaxJSDocDescriptionLength()
