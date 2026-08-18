import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { firstCommentContentChar, isDirectiveComment } from "@/lib/utils/comments"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "capitalize"

/**
 * Flags a comment whose first prose letter is lowercase and capitalizes it, so
 * comments read as sentences. Continuation lines of a wrapped `//` comment,
 * tooling directives, and comments that open with code, a symbol, or a URL are
 * left alone.
 */
class RequireCapitalizedComments extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-capitalized-comments"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Require a comment to start with an uppercase letter.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            capitalize: nitpick({
                problem: "This comment starts with a lowercase letter.",
                why: "A comment reads as a sentence, and a sentence starts with a capital letter",
                fix: "Capitalize the first letter of the comment",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        // Whether a "//" comment continues a wrapped one, i.e the previous
        // physical line is itself a line comment
        const isContinuation = (comment: TSESTree.Comment): boolean => {
            if (comment.type !== "Line") return false

            const previous = context.sourceCode.lines[comment.loc.start.line - 2]
            return previous !== undefined && /^\s*\/\//.test(previous)
        }

        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (isDirectiveComment(comment) || isContinuation(comment)) continue

                    const content = firstCommentContentChar(comment)
                    if (content === null || !/\p{Ll}/u.test(content.char)) continue

                    // Leave a comment that opens with a URL alone, capitalizing it
                    // would break the link
                    if (/^(?:https?:\/\/|www\.)/u.test(context.sourceCode.getText().slice(content.index))) continue

                    context.report({
                        loc: {
                            start: context.sourceCode.getLocFromIndex(content.index),
                            end: context.sourceCode.getLocFromIndex(content.index + content.char.length),
                        },
                        messageId: "capitalize",
                        fix: fixer =>
                            fixer.replaceTextRange(
                                [content.index, content.index + content.char.length],
                                content.char.toUpperCase(),
                            ),
                    })
                }
            },
        }
    }
}

export default new RequireCapitalizedComments()
