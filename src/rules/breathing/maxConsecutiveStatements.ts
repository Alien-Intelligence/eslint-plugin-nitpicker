import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"
import {
    hasBlankLineAbove,
    isGuardClause,
    isMultiline,
    parallelShape,
    sharesLineWithPrevious,
    statementStart,
    unlabeled,
} from "@/lib/utils/statements"

type Options = [{ max: number }]
type MessageIds = "tooMany"

/**
 * Flags a run of sibling statements with no blank line anywhere in it, since a
 * wall of statements is a paragraph with no sentence breaks. Guard clauses,
 * assignment tables, and multi-line blocks are read as single thoughts rather
 * than as separate lines.
 */
class MaxConsecutiveStatements extends NitpickerRule<MessageIds, Options> {
    readonly name = "max-consecutive-statements"

    readonly defaultOptions: Options = [{ max: CONSTANTS.STATEMENTS.MAX_CONSECUTIVE }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Enforce a maximum run of sibling statements with no blank line between them.",
            recommended: true,
            category: "breathing",
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
            tooMany: nitpick({
                problem: "This run of {{count}} statements has no blank line in it, over the limit of {{max}}.",
                why: "An unbroken wall of statements reads as one undifferentiated step, so the shape of the logic disappears",
                fix: "Add a blank line between the groups that serve different purposes, or extract one of them into a function",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const max = options[0]?.max ?? CONSTANTS.STATEMENTS.MAX_CONSECUTIVE

        /**
         * Reports a run that is longer than the limit, pointing at the statement
         * the wall grew too long on, which is also where it wants breaking.
         * @param run The statements counted in one unbroken run.
         */
        const report = (run: TSESTree.Node[]): void => {
            if (run.length <= max) return

            const offender = run[max]
            if (offender === undefined) return

            context.report({
                node: statementStart(context.sourceCode, offender).node,
                messageId: "tooMany",
                data: { count: run.length, max },
            })
        }

        /**
         * Splits a statement list into runs of statements with no blank line
         * between them, then reports the ones that grew too long.
         * @param statements The statements of one block.
         */
        const check = (statements: TSESTree.Node[]): void => {
            let run: TSESTree.Node[] = []
            let table: string | null = null

            for (const [index, statement] of statements.entries()) {
                const previous = statements[index - 1]

                // A blank line above closes the run, and so does the top of the block
                if (index === 0 || hasBlankLineAbove(context.sourceCode, statement)) {
                    report(run)
                    run = []
                    table = null
                }

                // A multi-line block brings its own air, so it ends the run rather
                // than counting toward it, which also leaves it to
                // "require-blank-before-block" to separate
                if (isMultiline(unlabeled(statement))) {
                    report(run)
                    run = []
                    table = null
                    continue
                }

                // The trailing exit is "require-blank-before-return"'s business,
                // counting it here would report the same line twice
                if (index === statements.length - 1 && CONSTANTS.STATEMENTS.EXITS.has(statement.type)) continue

                // A guard filters the current step rather than starting a new one
                if (isGuardClause(statement)) continue

                // Statements sharing a line have nowhere sensible to be broken
                if (previous !== undefined && sharesLineWithPrevious(context.sourceCode, statement, previous)) continue

                // An unbroken run of statements built the same way reads as one
                // table, however long it runs, so it counts once
                const shape = parallelShape(context.sourceCode, statement)
                if (shape !== null && shape === table) continue

                table = shape
                run.push(statement)
            }

            report(run)
        }

        return {
            BlockStatement(node) {
                check(node.body)
            },
            StaticBlock(node) {
                check(node.body)
            },
            SwitchCase(node) {
                check(node.consequent)
            },
        }
    }
}

export default new MaxConsecutiveStatements()
