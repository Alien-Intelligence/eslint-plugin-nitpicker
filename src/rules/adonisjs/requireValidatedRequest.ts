import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import { matchesGlob } from "@/lib/utils/regex"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ allowIn: string[] }]
type MessageIds = "rawRead"

/**
 * Flags a raw `request.input()`, `request.body()`, `request.qs()`, etc. read, so
 * request data goes through `request.validateUsing(validator)` instead, the
 * `allowIn` option lists globs (e.g. passthrough proxy controllers) that are
 * exempt.
 */
class RequireValidatedRequest extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-validated-request"

    readonly defaultOptions: Options = [{ allowIn: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require request data to be read through a Vine validator, not raw request accessors.",
            recommended: true,
            category: "adonisjs",
        },
        schema: [
            {
                type: "object",
                properties: {
                    allowIn: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            rawRead: nitpick({
                problem: "`request.{{method}}()` reads request data directly.",
                why: "Request data must pass through a Vine validator so it is typed and checked, a raw accessor bypasses that contract",
                fix: "Read it through `request.validateUsing(someValidator)` instead",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const allowIn = options[0]?.allowIn ?? []
        if (allowIn.length > 0 && matchesGlob(context.filename, allowIn)) {
            return {}
        }

        /**
         * Checks whether an expression refers to the HttpContext request, whether
         * bound directly or reached through `ctx.request`.
         * @param node The expression to inspect.
         * @returns True if the expression is the request.
         */
        const isRequest = (node: TSESTree.Node): boolean => {
            if (node.type === "Identifier") return node.name === "request"
            return (
                node.type === "MemberExpression" &&
                node.property.type === "Identifier" &&
                node.property.name === "request"
            )
        }

        return {
            CallExpression(node) {
                if (node.callee.type !== "MemberExpression" || node.callee.property.type !== "Identifier") return
                if (!CONSTANTS.REQUEST.RAW_ACCESSORS.has(node.callee.property.name) || !isRequest(node.callee.object))
                    return

                context.report({
                    node: node.callee.property,
                    messageId: "rawRead",
                    data: {
                        method: node.callee.property.name,
                    },
                })
            },
        }
    }
}

export default new RequireValidatedRequest()
