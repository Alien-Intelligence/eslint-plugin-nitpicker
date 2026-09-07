import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"
import {
    blankLineFix,
    consumesPreviousDeclaration,
    hasBlankLineAbove,
    hasBracedBody,
    isMultiline,
    sharesLineWithPrevious,
    statementStart,
    unlabeled,
} from "@/lib/utils/statements"

type Options = [{ allowAfterDeclaration: boolean }]
type MessageIds = "blankLine"

/**
 * Flags a multi-line control-flow block that sits flush against the statement
 * above it, so every block opens its own paragraph instead of being glued to
 * whatever came before.
 */
class RequireBlankBeforeBlock extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-blank-before-block"

    readonly defaultOptions: Options = [{ allowAfterDeclaration: true }]

    readonly meta = {
        type: "layout",
        fixable: "whitespace",
        docs: {
            description: "Require a blank line before a multi-line control-flow block.",
            recommended: true,
            category: "breathing",
        },
        schema: [
            {
                type: "object",
                properties: {
                    allowAfterDeclaration: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            blankLine: nitpick({
                problem: "This block sits flush against the statement above it.",
                why: "A block is a paragraph of its own, gluing it to the line above hides where one step ends and the next begins",
                fix: "Add a blank line above it (single-line guards and the first statement of a block need none)",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const allowAfterDeclaration = options[0]?.allowAfterDeclaration ?? true

        /**
         * Reports every multi-line block in a statement list that has no blank
         * line above it.
         * @param statements The statements of one block.
         */
        const check = (statements: TSESTree.Node[]): void => {
            // The first statement opens the list, so the brace already separates it
            for (const [index, statement] of statements.entries()) {
                if (index === 0) continue

                const previous = statements[index - 1]
                if (previous === undefined) continue

                // A labeled loop is still a loop, the label only wraps it
                const body = unlabeled(statement)
                if (!CONSTANTS.STATEMENTS.CONTROL_FLOW.has(body.type)) continue

                // Braced rather than merely multi-line, so a guard clause the
                // formatter wrapped onto two lines stays exempt
                if (!hasBracedBody(body) || !isMultiline(statement)) continue

                if (sharesLineWithPrevious(context.sourceCode, statement, previous)) continue
                if (hasBlankLineAbove(context.sourceCode, statement)) continue

                // Seeding a value then immediately branching on it is a single thought
                if (allowAfterDeclaration && consumesPreviousDeclaration(context.sourceCode, previous, statement)) {
                    continue
                }

                const start = statementStart(context.sourceCode, statement)

                context.report({
                    node: start.node,
                    messageId: "blankLine",
                    fix: fixer => blankLineFix(fixer, start),
                })
            }
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
            Program(node) {
                check(node.body)
            },
            TSModuleBlock(node) {
                check(node.body)
            },
        }
    }
}

export default new RequireBlankBeforeBlock()
