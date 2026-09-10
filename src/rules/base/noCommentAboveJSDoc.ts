import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { isAdjacentAbove, isDirectiveComment, isOwnLineComment } from "@/lib/utils/comments"
import { isJSDocComment } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "stacked"

/**
 * Flags a comment stacked directly on top of a JSDoc, so one declaration is
 * described in one place rather than split across two blocks the reader has to
 * merge.
 */
class NoCommentAboveJSDoc extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-comment-above-jsdoc"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow a comment stacked directly above a JSDoc block.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            stacked: nitpick({
                problem: "This comment sits directly above a JSDoc, splitting one description in two.",
                why: "A reader has to merge two blocks written in different registers, and the prose up here escapes the JSDoc length limit",
                fix: "Move implementation rationale down to the code it explains, and keep the JSDoc as the description of what this is",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        /**
         * Collects the unbroken run of own-line comments stacked above a JSDoc.
         * @param comments Every comment in the file, in source order.
         * @param index The position of the JSDoc to walk up from.
         * @returns The stacked comments, top to bottom, empty when there are none.
         */
        const runAbove = (comments: TSESTree.Comment[], index: number): TSESTree.Comment[] => {
            const run: TSESTree.Comment[] = []
            let below = comments[index]

            for (let above = index - 1; above >= 0; above--) {
                const comment = comments[above]
                if (comment === undefined || below === undefined) break

                // A JSDoc of its own is a separate description, not a preamble
                if (isJSDocComment(comment)) break

                // A directive belongs to the declaration, and a trailing comment
                // belongs to the code beside it, so neither is stacked prose
                if (isDirectiveComment(comment)) break
                if (!isOwnLineComment(context.sourceCode, comment)) break
                if (!isAdjacentAbove(comment, below)) break

                run.unshift(comment)
                below = comment
            }

            return run
        }

        return {
            Program() {
                const comments = context.sourceCode.getAllComments()

                for (const [index, comment] of comments.entries()) {
                    if (!isJSDocComment(comment)) continue

                    const run = runAbove(comments, index)
                    const first = run[0]
                    const last = run.at(-1)
                    if (first === undefined || last === undefined) continue

                    // A banner on line 1 is the file's own header, not this
                    // declaration's description
                    if (first.loc.start.line === 1) continue

                    context.report({
                        loc: { start: first.loc.start, end: last.loc.end },
                        messageId: "stacked",
                    })
                }
            },
        }
    }
}

export default new NoCommentAboveJSDoc()
