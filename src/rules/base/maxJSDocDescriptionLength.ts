import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import type { NitpickerRuleDocs } from "@/lib/utils/createRule"
import { getJSDocDescription, isJSDocComment } from "@/lib/utils/JSDoc"
import { nitpick } from "@/lib/utils/nitpick"

type Options = [{ max: number }]
type MessageIds = "tooLong"

const DEFAULT_MAX = 250

/**
 * Flags JSDoc comments whose description (the prose before the first tag) is
 * longer than the configured character limit, catching the oversized,
 * essay-like blocks AI models tend to produce.
 */
class MaxJSDocDescriptionLength extends NitpickerRule<MessageIds, Options> {
    readonly name = "max-jsdoc-description-length"

    readonly defaultOptions: Options = [{ max: DEFAULT_MAX }]

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
        const max = options[0]?.max ?? DEFAULT_MAX
        const { sourceCode } = context

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
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
