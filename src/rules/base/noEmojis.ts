import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "emoji"

/**
 * Flags every emoji found anywhere in the source and removes it, since emojis
 * are noise in code, comments, and identifiers.
 */
class NoEmojis extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-emojis"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow emoji characters anywhere in the source.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            emoji: nitpick({
                problem: "Found an emoji ({{emoji}}).",
                why: "Emojis are usually introduced by AI-generated text and add noise to code, comments, and identifiers",
                fix: "Discard the emoji",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        const text = context.sourceCode.getText()

        return {
            Program() {
                // Scan the raw source so every emoji is caught, whether it
                // appears in code, strings, or comments
                for (const match of text.matchAll(CONSTANTS.EMOJI)) {
                    const emoji = match[0]
                    const end = match.index + emoji.length

                    context.report({
                        loc: {
                            start: context.sourceCode.getLocFromIndex(match.index),
                            end: context.sourceCode.getLocFromIndex(end),
                        },
                        messageId: "emoji",
                        data: { emoji },
                        fix: fixer => fixer.removeRange([match.index, end]),
                    })
                }
            },
        }
    }
}

export default new NoEmojis()
