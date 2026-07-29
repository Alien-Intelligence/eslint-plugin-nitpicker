import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { hasLeadingJSDoc } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import { isMigrationClass } from "@/lib/utils/migrations"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "missingJSDoc"

/**
 * Requires a JSDoc comment above an AdonisJS migration (a default-exported class
 * extending `BaseSchema`) so its intent is documented, the timestamped filename
 * alone does not convey what the migration changes.
 */
class RequireMigrationJSDoc extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-migration-jsdoc"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a JSDoc comment describing an AdonisJS migration.",
            recommended: true,
            category: "adonisjs",
        },
        schema: [],
        messages: {
            missingJSDoc: nitpick({
                problem: "This migration has no JSDoc describing what it does.",
                why: "A migration's intent should be readable at a glance, the timestamped filename does not convey the schema change",
                fix: "Add a `/** ... */` JSDoc above the migration class summarizing the change",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            ClassDeclaration(node) {
                if (!isMigrationClass(node)) return
                if (hasLeadingJSDoc(context.sourceCode, node.parent)) return

                context.report({ node: node.id ?? node, messageId: "missingJSDoc" })
            },
        }
    }
}

export default new RequireMigrationJSDoc()
