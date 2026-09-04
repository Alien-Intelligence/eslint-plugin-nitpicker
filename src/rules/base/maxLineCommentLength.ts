import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { isDirectiveComment } from "@/lib/utils/comments"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ max: number }]
type MessageIds = "tooLong"

/**
 * Flags a run of stacked `//` comments whose prose runs past the configured
 * limit, applying the same cap to a wall of line comments that
 * `max-jsdoc-description-length` applies to a JSDoc description.
 */
class MaxLineCommentLength extends NitpickerRule<MessageIds, Options> {
    readonly name = "max-line-comment-length"

    readonly defaultOptions: Options = [{ max: CONSTANTS.COMMENTS.MAX_RUN_LENGTH }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Enforce a maximum prose length for a run of consecutive `//` line comments.",
            recommended: true,
            category: "base",
        },
        schema: [
            {
                type: "object",
                properties: {
                    max: { type: "integer", minimum: 1 },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            tooLong: nitpick({
                problem: "This run of line comments is {{length}} characters, over the {{max}}-character limit.",
                why: "A wall of stacked `//` lines is a paragraph in disguise, it buries the point and is hard to read next to the code",
                fix: "Cut it to the essential why, or move the long explanation into a JSDoc on the declaration it belongs to",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const max = options[0]?.max ?? CONSTANTS.COMMENTS.MAX_RUN_LENGTH

        /**
         * Joins the prose a run carries, with each marker and its padding stripped.
         * @param run The consecutive line comments to read.
         * @returns The joined prose.
         */
        const proseOf = (run: TSESTree.Comment[]): string =>
            run
                .map(comment => comment.value.trim())
                .filter(text => text !== "")
                .join(" ")

        /**
         * Reports a run whose prose runs past the limit.
         * @param run The consecutive line comments to measure.
         */
        const report = (run: TSESTree.Comment[]): void => {
            if (run.length === 0) return

            const length = proseOf(run).length
            if (length <= max) return

            const first = run[0]
            const last = run.at(-1)
            if (first === undefined || last === undefined) return

            context.report({
                loc: { start: first.loc.start, end: last.loc.end },
                messageId: "tooLong",
                data: { length, max },
            })
        }

        return {
            Program() {
                let run: TSESTree.Comment[] = []

                for (const comment of context.sourceCode.getAllComments()) {
                    const previous = run.at(-1)
                    const isConsecutive =
                        previous !== undefined && comment.loc.start.line === previous.loc.start.line + 1

                    if (comment.type !== "Line" || isDirectiveComment(comment) || !isConsecutive) {
                        report(run)
                        run = comment.type === "Line" && !isDirectiveComment(comment) ? [comment] : []
                        continue
                    }

                    run.push(comment)
                }

                report(run)
            },
        }
    }
}

export default new MaxLineCommentLength()
