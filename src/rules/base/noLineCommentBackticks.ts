import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { findBacktickSpans, isDirectiveComment } from "@/lib/utils/comments"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "backticks"

/**
 * Flags a backtick-fenced code reference inside a `//` line comment and rewrites
 * it with double quotes, since backticks only render as code in a JSDoc block.
 * Code fences, unpaired backticks, and directives are left alone.
 */
class NoLineCommentBackticks extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-line-comment-backticks"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow backticks in `//` line comments, use double quotes for code references.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            backticks: nitpick({
                problem: "This line comment wraps `{{text}}` in backticks.",
                why: "Backticks only render as code inside a JSDoc block, in a `//` comment they stay literal characters, so double quotes read better",
                fix: 'Wrap it in double quotes instead: "{{text}}"',
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    // A JSDoc block is where backticks do render, so only "//"
                    // comments are rewritten, and never a tooling directive
                    if (comment.type !== "Line" || isDirectiveComment(comment)) continue

                    for (const span of findBacktickSpans(comment)) {
                        context.report({
                            loc: {
                                start: context.sourceCode.getLocFromIndex(span.start),
                                end: context.sourceCode.getLocFromIndex(span.end + 1),
                            },
                            messageId: "backticks",
                            data: { text: span.text },
                            fix: fixer => [
                                fixer.replaceTextRange([span.start, span.start + 1], '"'),
                                fixer.replaceTextRange([span.end, span.end + 1], '"'),
                            ],
                        })
                    }
                }
            },
        }
    }
}

export default new NoLineCommentBackticks()
