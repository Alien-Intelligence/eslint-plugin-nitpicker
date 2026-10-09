import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { findProseSemicolons, isDirectiveComment } from "@/lib/utils/comments"
import { getJSDocTags, isJSDocComment } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "semicolon"

/**
 * Flags a semicolon used as prose punctuation in any comment. Code is left
 * alone: fenced blocks, quoted or back-ticked spans, `@example` blocks, tokens
 * like `for (;;)`, HTML entities, and tooling directives.
 */
class NoCommentSemicolons extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-comment-semicolons"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow semicolons as prose punctuation inside comments.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            semicolon: nitpick({
                problem: "This comment uses a semicolon to join two clauses.",
                why: "A semicolon splices two thoughts into one dense run, comments here link clauses with a comma or a conjunction instead",
                fix: "Replace it with a comma or a conjunction such as `so` or `but` (reported, not auto-fixed, since the right join depends on the sentence), and put code in quotes or backticks",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (isDirectiveComment(comment)) continue

                    // An "@example" block is code, it runs until the next tag
                    const tags = isJSDocComment(comment) ? getJSDocTags(comment) : []
                    const examples = tags.flatMap((tag, index) =>
                        tag.name === "example"
                            ? [{ start: tag.index, end: tags[index + 1]?.index ?? comment.range[1] }]
                            : [],
                    )

                    for (const semicolon of findProseSemicolons(comment)) {
                        if (examples.some(example => semicolon >= example.start && semicolon < example.end)) continue

                        context.report({
                            loc: {
                                start: context.sourceCode.getLocFromIndex(semicolon),
                                end: context.sourceCode.getLocFromIndex(semicolon + 1),
                            },
                            messageId: "semicolon",
                        })
                    }
                }
            },
        }
    }
}

export default new NoCommentSemicolons()
