import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"
import {
    blankLineFix,
    consumesPreviousDeclaration,
    hasBlankLineAbove,
    sharesLineWithPrevious,
    statementStart,
} from "@/lib/utils/statements"

type Options = [{ minStatements: number; allowAfterDeclaration: boolean }]
type MessageIds = "blankLine"

/**
 * Flags a block of several statements whose closing `return` or `throw` sits
 * flush against the work above it, so the conclusion of a block reads as its own
 * paragraph rather than as one more line of the body.
 */
class RequireBlankBeforeReturn extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-blank-before-return"

    readonly defaultOptions: Options = [
        {
            minStatements: CONSTANTS.STATEMENTS.MIN_STATEMENTS_BEFORE_EXIT,
            allowAfterDeclaration: true,
        },
    ]

    readonly meta = {
        type: "layout",
        fixable: "whitespace",
        docs: {
            description: "Require a blank line before the statement a block exits on.",
            recommended: true,
            category: "breathing",
        },
        schema: [
            {
                type: "object",
                properties: {
                    minStatements: { type: "integer", minimum: 2 },
                    allowAfterDeclaration: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            blankLine: nitpick({
                problem: "This exit sits flush against the statement above it.",
                why: "A block's conclusion is its own thought, and a return buried in a wall of statements is easy to miss",
                fix: "Add a blank line above it (the count includes the exit itself, so a shorter block needs none)",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const minStatements = options[0]?.minStatements ?? CONSTANTS.STATEMENTS.MIN_STATEMENTS_BEFORE_EXIT
        const allowAfterDeclaration = options[0]?.allowAfterDeclaration ?? true

        /**
         * Reports the closing exit of a block that is long enough to need one.
         * @param statements The statements of one block.
         */
        const check = (statements: TSESTree.Statement[]): void => {
            if (statements.length < Math.max(minStatements, 2)) return

            const exit = statements[statements.length - 1]
            const previous = statements[statements.length - 2]
            if (exit === undefined || previous === undefined) return
            if (!CONSTANTS.STATEMENTS.EXITS.has(exit.type)) return

            // A one-line block has nowhere to put the break without dragging the
            // statements before it onto a new line, so leave it to a formatter
            if (sharesLineWithPrevious(context.sourceCode, exit, previous)) return
            if (hasBlankLineAbove(context.sourceCode, exit)) return

            // Seeding a value then immediately returning it is a single thought
            if (allowAfterDeclaration && consumesPreviousDeclaration(context.sourceCode, previous, exit)) return

            const start = statementStart(context.sourceCode, exit)

            context.report({
                node: start.node,
                messageId: "blankLine",
                fix: fixer => blankLineFix(fixer, start),
            })
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

export default new RequireBlankBeforeReturn()
