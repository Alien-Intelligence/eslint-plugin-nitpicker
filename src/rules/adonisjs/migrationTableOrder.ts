import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import { getCreateTableBuilder, getTableStatementCategory } from "@/lib/utils/migrations"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "outOfOrder"

/**
 * Enforces that a migration's `createTable` statements stay grouped in order:
 * columns, then audit timestamps, then indexes and constraints, this keeps every
 * migration structured the same way without needing section-label comments.
 */
class MigrationTableOrder extends NitpickerRule<MessageIds, Options> {
    readonly name = "migration-table-order"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Group migration table statements as columns, then timestamps, then indexes and constraints.",
            recommended: true,
            category: "adonisjs",
        },
        schema: [],
        messages: {
            outOfOrder: nitpick({
                problem: "This {{category}} is out of order in the table definition.",
                why: "A migration reads consistently when columns come first, then timestamps, then indexes and constraints, each grouped together",
                fix: "Move it into its group so the order stays columns, timestamps, then indexes and constraints",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            CallExpression(node) {
                const builder = getCreateTableBuilder(node)
                if (builder === null) return

                let maxRank = 0

                for (const statement of builder.body) {
                    const category = getTableStatementCategory(statement, builder.builderName)
                    if (category === null) continue

                    const rank = CONSTANTS.MIGRATIONS.CATEGORY_ORDER.indexOf(category)
                    if (rank < maxRank) {
                        context.report({ node: statement, messageId: "outOfOrder", data: { category } })
                    }

                    maxRank = Math.max(maxRank, rank)
                }
            },
        }
    }
}

export default new MigrationTableOrder()
