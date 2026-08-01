import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import { isContextHookName } from "@/lib/utils/react"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "destructure"

/**
 * Flags a context-consumer hook (`use…Context`) whose result is bound whole to a
 * variable instead of being destructured, since destructuring names exactly what
 * the caller uses and reads better than repeated `context.member` access.
 */
class RequireContextHookDestructure extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-context-hook-destructure"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require the result of a context-consumer hook to be destructured.",
            recommended: true,
            category: "react",
        },
        schema: [],
        messages: {
            destructure: nitpick({
                problem: "`{{hook}}` is bound whole instead of destructured.",
                why: "Destructuring at the call site names exactly what the caller uses and reads better than repeated `{{name}}.member` access",
                fix: "Destructure the members in use, e.g. `const { a, b } = {{hook}}()`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            VariableDeclarator(node) {
                if (node.id.type !== "Identifier" || node.init?.type !== "CallExpression") return
                if (node.init.callee.type !== "Identifier" || !isContextHookName(node.init.callee.name)) return

                context.report({
                    node,
                    messageId: "destructure",
                    data: { hook: node.init.callee.name, name: node.id.name },
                })
            },
        }
    }
}

export default new RequireContextHookDestructure()
