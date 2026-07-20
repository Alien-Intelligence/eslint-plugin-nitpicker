import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import type { NitpickerRuleDocs } from "@/lib/utils/createRule"
import { isWordChar } from "@/lib/utils/isWordChar"
import { nitpick } from "@/lib/utils/nitpick"

type Options = []
type MessageIds = "period"

/**
 * Flags periods used as prose punctuation inside `//` line comments.
 *
 * Line comments should read as short, clear fragments rather than full
 * sentences, so periods are just noise. Dots that are part of a token, such as
 * `foo.bar`, `1.5`, `file.ts` or `.env`, are deliberately left alone.
 */
class NoLineCommentPeriod extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-line-comment-period"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "layout",
        fixable: "code",
        docs: {
            description: "Disallow prose periods in `//` line comments (dots inside code references are allowed).",
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
        const { sourceCode } = context

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (comment.type !== "Line") continue

                    const { value } = comment
                    // The comment value starts right after the leading `//`
                    const valueStart = comment.range[0] + 2

                    for (let index = 0; index < value.length; index++) {
                        if (value[index] !== ".") continue

                        // Group a run of consecutive dots (e.g an ellipsis) so
                        // it becomes a single report rather than one per dot
                        let end = index
                        while (value[end + 1] === ".") end++

                        // A lone dot immediately followed by a word character is
                        // part of a token (`foo.bar`, `1.5`, `.env`), not prose
                        const isCodeDot = end === index && isWordChar(value[end + 1])

                        if (!isCodeDot) {
                            const from = valueStart + index
                            const to = valueStart + end + 1

                            context.report({
                                loc: {
                                    start: sourceCode.getLocFromIndex(from),
                                    end: sourceCode.getLocFromIndex(to),
                                },
                                messageId: "period",
                                fix: fixer => fixer.removeRange([from, to]),
                            })
                        }

                        index = end
                    }
                }
            },
        }
    }
}

export default new NoLineCommentPeriod()
