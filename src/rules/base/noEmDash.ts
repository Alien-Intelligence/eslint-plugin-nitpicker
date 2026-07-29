import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "emDash"

/**
 * Flags every em dash (—) character found anywhere in the source.
 */
class NoEmDash extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-em-dash"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow the em dash (—) character anywhere in the source.",
            recommended: true,
        },
        schema: [],
        messages: {
            emDash: nitpick({
                problem: "Found an em dash (—) character.",
                why: "Em dashes are typically introduced by AI-generated or auto-formatted text and are discouraged here.",
                fix: "Replace the em dash with a hyphen (-), a comma (,), or reword the sentence to avoid it.",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        const text = context.sourceCode.getText()

        return {
            Program() {
                // Scan the raw source so every em dash is caught, whether it appears
                // in code, strings, or comments
                for (let index = 0; index < text.length; index++) {
                    if (text[index] !== CONSTANTS.EM_DASH) continue

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
