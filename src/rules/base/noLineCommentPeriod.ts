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
 * `foo.bar`, `1.5`, `file.ts` or `.env`, and ellipses (`...`) are left alone.
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

                        // A run of consecutive dots is an ellipsis, leave it alone
                        if (value[index + 1] === ".") {
                            while (value[index + 1] === ".") index++
                            continue
                        }

                        // A lone dot immediately followed by a word character is
                        // part of a token (`foo.bar`, `1.5`, `.env`), not prose
                        if (isWordChar(value[index + 1])) continue

                        const at = valueStart + index

                        context.report({
                            loc: {
                                start: sourceCode.getLocFromIndex(at),
                                end: sourceCode.getLocFromIndex(at + 1),
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
