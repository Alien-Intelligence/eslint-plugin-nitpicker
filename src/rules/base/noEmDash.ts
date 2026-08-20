import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { allowedRanges, isInAnyRange, type SourceLocation } from "@/lib/utils/locations"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ allow?: SourceLocation[] }]
type MessageIds = "emDash"

/**
 * Flags every em dash (—) character found anywhere in the source, except in the
 * locations the `allow` option exempts.
 */
class NoEmDash extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-em-dash"

    readonly defaultOptions: Options = [{ allow: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow the em dash (—) character anywhere in the source.",
            recommended: true,
        },
        schema: [
            {
                type: "object",
                properties: {
                    allow: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["strings", "templates", "jsx", "comments"],
                        },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            emDash: nitpick({
                problem: "Found an em dash (—) character.",
                why: "Em dashes are typically introduced by AI-generated or auto-formatted text and are discouraged here.",
                fix: "Replace the em dash with a hyphen (-), a comma (,), or reword the sentence to avoid it, or allow it here with the rule's `allow` option if it is deliberate user-facing copy.",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        return {
            Program() {
                const text = context.sourceCode.getText()
                const ranges = allowedRanges(context.sourceCode, options[0]?.allow ?? [])

                // Scan the raw source so every em dash is caught, whether it appears
                // in code, strings, or comments
                for (let index = 0; index < text.length; index++) {
                    if (text[index] !== CONSTANTS.EM_DASH) continue
                    if (isInAnyRange(index, ranges)) continue

                    context.report({
                        loc: {
                            start: context.sourceCode.getLocFromIndex(index),
                            end: context.sourceCode.getLocFromIndex(index + 1),
                        },
                        messageId: "emDash",
                    })
                }
            },
        }
    }
}

export default new NoEmDash()
