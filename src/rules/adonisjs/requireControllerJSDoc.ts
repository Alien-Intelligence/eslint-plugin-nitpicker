import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { isControllerClass } from "@/lib/utils/controllers"
import { hasLeadingJSDoc } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "missingJSDoc"

/**
 * Requires a JSDoc comment above an AdonisJS controller (a default-exported
 * class whose name ends with `Controller`) so the responsibility it serves is
 * documented at a glance, before diving into its handler methods.
 */
class RequireControllerJSDoc extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-controller-jsdoc"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a JSDoc comment describing an AdonisJS controller.",
            recommended: true,
            category: "adonisjs",
        },
        schema: [],
        messages: {
            missingJSDoc: nitpick({
                problem: "This controller has no JSDoc describing what it does.",
                why: "A controller's responsibility should be readable at a glance, before diving into its handler methods",
                fix: "Add a `/** ... */` JSDoc above the controller class summarizing what it handles",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            ClassDeclaration(node) {
                if (!isControllerClass(node)) return
                if (hasLeadingJSDoc(context.sourceCode, node.parent)) return

                context.report({ node: node.id ?? node, messageId: "missingJSDoc" })
            },
        }
    }
}

export default new RequireControllerJSDoc()
