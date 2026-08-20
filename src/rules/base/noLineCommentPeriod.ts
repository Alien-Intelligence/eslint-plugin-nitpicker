import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { findProsePeriods } from "@/lib/utils/comments"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "period" | "sentence"

/**
 * Flags periods used as prose punctuation inside `//` line comments. Dots that
 * are part of a token (`foo.bar`, `1.5`, `.env`, `subagent.*`), dots inside a
 * quoted span, ellipses, and abbreviations like `e.g.` are left alone.
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
                problem: "This line comment ends with a period.",
                why: "Line comments should be short, clear fragments, not full sentences, so a closing period is just noise, dots inside code references like `foo.bar` are allowed.",
                fix: "Remove the period and keep the comment terse.",
            }),
            sentence: nitpick({
                problem: "This line comment runs two sentences together with a period.",
                why: "Line comments should be short, clear fragments, dropping the period on its own would leave a run-on, so the sentences belong on separate lines",
                fix: "Split it into one `//` line per fragment, or reword it as a single fragment (reported, not auto-fixed, so wrapped prose is never mangled)",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (comment.type !== "Line") continue

                    for (const period of findProsePeriods(comment)) {
                        const loc = {
                            start: context.sourceCode.getLocFromIndex(period.index),
                            end: context.sourceCode.getLocFromIndex(period.index + 1),
                        }

                        // A period that closes the comment can simply go, nothing
                        // follows it to run together
                        if (period.terminal) {
                            context.report({
                                loc,
                                messageId: "period",
                                fix: fixer => fixer.removeRange([period.index, period.index + 1]),
                            })

                            continue
                        }

                        // Mid-comment, the period separates two fragments, and
                        // splitting it onto a new line mangles wrapped prose, so this
                        // case is reported for a human or agent to reword, not fixed
                        context.report({ loc, messageId: "sentence" })
                    }
                }
            },
        }
    }
}

export default new NoLineCommentPeriod()
