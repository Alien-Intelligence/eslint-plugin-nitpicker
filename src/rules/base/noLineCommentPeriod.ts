import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"
import { isWordChar } from "@/lib/utils/words"

type Options = []
type MessageIds = "period"

/**
 * Flags periods used as prose punctuation inside `//` line comments. Dots that
 * are part of a token (`foo.bar`, `1.5`, `.env`) and ellipses (`...`) are left
 * alone.
 */
class NoLineCommentPeriod extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-line-comment-period"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "layout",
        fixable: "code",
        docs: {
            description: "Disallow prose periods in `//` line comments (code-reference dots and ellipses are allowed).",
            recommended: true,
        },
        schema: [],
        messages: {
            period: nitpick({
                problem: "This line comment contains a period.",
                why: "Line comments should be short, clear fragments, not full sentences, so periods are just noise, dots inside code references like `foo.bar` are allowed.",
                fix: "Remove the period and keep the comment terse.",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (comment.type !== "Line") continue

                    // The comment value starts right after the leading `//`
                    const valueStart = comment.range[0] + 2

                    for (let index = 0; index < comment.value.length; index++) {
                        if (comment.value[index] !== ".") continue

                        // A run of consecutive dots is an ellipsis, leave it alone
                        if (comment.value[index + 1] === ".") {
                            while (comment.value[index + 1] === ".") index++
                            continue
                        }

                        // A lone dot immediately followed by a word character is
                        // part of a token (`foo.bar`, `1.5`, `.env`), not prose
                        if (isWordChar(comment.value[index + 1])) continue

                        const at = valueStart + index

                        context.report({
                            loc: {
                                start: context.sourceCode.getLocFromIndex(at),
                                end: context.sourceCode.getLocFromIndex(at + 1),
                            },
                            messageId: "period",
                            fix: fixer => fixer.removeRange([at, at + 1]),
                        })
                    }
                }
            },
        }
    }
}

export default new NoLineCommentPeriod()
