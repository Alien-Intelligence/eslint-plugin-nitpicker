import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { allowedRanges, isInAnyRange, type SourceLocation } from "@/lib/utils/locations"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ allow?: SourceLocation[] }]
type MessageIds = "emoji"

/**
 * Flags every emoji in the source, except where the `allow` option exempts it.
 * Report-only, never auto-removing a glyph, since an emoji can carry meaning that
 * a silent deletion would lose.
 */
class NoEmojis extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-emojis"

    readonly defaultOptions: Options = [{ allow: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow emoji characters anywhere in the source.",
            recommended: true,
            category: "base",
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
            emoji: nitpick({
                problem: "Found an emoji ({{emoji}}).",
                why: "Emojis are usually introduced by AI-generated text and add noise to code, comments, and identifiers",
                fix: "Remove the emoji, or allow it here with the rule's `allow` option if it is deliberate user-facing copy",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        return {
            Program() {
                const text = context.sourceCode.getText()
                const ranges = allowedRanges(context.sourceCode, options[0]?.allow ?? [])

                // Scan the raw source so every emoji is caught, whether it appears
                // in code, strings, or comments
                for (const match of text.matchAll(CONSTANTS.EMOJI)) {
                    if (isInAnyRange(match.index, ranges)) continue

                    context.report({
                        loc: {
                            start: context.sourceCode.getLocFromIndex(match.index),
                            end: context.sourceCode.getLocFromIndex(match.index + match[0].length),
                        },
                        messageId: "emoji",
                        data: { emoji: match[0] },
                    })
                }
            },
        }
    }
}

export default new NoEmojis()
