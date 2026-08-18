import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
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
                fix: "Split it into one `//` line per fragment, or reword it as a single fragment",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        // The indentation of a comment that sits alone on its line, or "null" when
        // code precedes it, as splitting a trailing comment would break that line
        const ownLineIndent = (comment: TSESTree.Comment): string | null => {
            const before = (context.sourceCode.lines[comment.loc.start.line - 1] ?? "").slice(
                0,
                comment.loc.start.column,
            )

            return before.trim() === "" ? before : null
        }

        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (comment.type !== "Line") continue

                    const indent = ownLineIndent(comment)

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

                        // Mid-comment, the period separates two fragments, so the
                        // fix moves the second one onto its own comment line,
                        // swallowing the spacing that followed the period
                        const offset = period.index - comment.range[0] - 2
                        const spacing = comment.value.slice(offset + 1).match(/^\s*/u)?.[0] ?? ""
                        const end = period.index + 1 + spacing.length

                        context.report({
                            loc,
                            messageId: "sentence",
                            fix:
                                indent === null
                                    ? null
                                    : fixer => fixer.replaceTextRange([period.index, end], `\n${indent}// `),
                        })
                    }
                }
            },
        }
    }
}

export default new NoLineCommentPeriod()
