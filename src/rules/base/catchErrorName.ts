import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "rename"

/**
 * Flags a `catch` clause that binds its error under any name other than `error`
 * (an underscore-prefixed name such as `_error` is allowed for a deliberately
 * unused binding), so error handling reads the same everywhere.
 */
class CatchErrorName extends NitpickerRule<MessageIds, Options> {
    readonly name = "catch-error-name"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a `catch` clause to bind its error as `error`.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            rename: nitpick({
                problem: "This `catch` binds the error as `{{name}}`.",
                why: "Every catch binds the error as `error` so error handling reads the same across the codebase",
                fix: "Rename the binding to `error`, or `_error` if it is intentionally unused",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            CatchClause(node) {
                // A bare catch with no binding, or a destructured binding, is left alone
                if (node.param?.type !== "Identifier") return
                if (node.param.name === "error" || node.param.name.startsWith("_")) return

                context.report({
                    node: node.param,
                    messageId: "rename",
                    data: { name: node.param.name },
                })
            },
        }
    }
}

export default new CatchErrorName()
