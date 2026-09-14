import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { isHttpContextParam, unwrapParam } from "@/lib/utils/controllers"
import type { FunctionNode } from "@/lib/utils/functions"
import { nitpick } from "@/lib/utils/messages"
import { matchesGlob } from "@/lib/utils/regex"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ allowIn: string[] }]
type MessageIds = "wholeContext"

/**
 * Flags a parameter that binds the whole AdonisJS `HttpContext` under one name
 * (`ctx: HttpContext`), so a handler destructures the context properties it
 * actually uses instead, the `allowIn` option lists globs that are exempt.
 */
class NoCtxHttpContextParam extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-ctx-httpcontext-param"

    readonly defaultOptions: Options = [{ allowIn: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow binding the whole AdonisJS HttpContext, destructure the properties used instead.",
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
            wholeContext: nitpick({
                problem: "The parameter `{{name}}` binds the whole `HttpContext`.",
                why: "A signature that destructures the context states what the handler touches, binding it whole hides that behind `{{name}}.` lookups at every use site",
                fix: "Destructure the properties used instead, e.g. `{ auth, request }: HttpContext`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const allowIn = options[0]?.allowIn ?? []
        if (allowIn.length > 0 && matchesGlob(context.filename, allowIn)) {
            return {}
        }

        /**
         * Reports each parameter of a function that takes the context whole.
         * @param fn The function to inspect.
         */
        const check = (fn: FunctionNode): void => {
            for (const param of fn.params) {
                const binding: TSESTree.Node = unwrapParam(param)

                // Only a single name standing for the context is the problem, a
                // destructured pattern is the shape the rule asks for
                if (binding.type !== "Identifier" || !isHttpContextParam(binding)) continue

                context.report({
                    node: binding,
                    messageId: "wholeContext",
                    data: { name: binding.name },
                })
            }
        }

        return {
            FunctionDeclaration(node) {
                check(node)
            },
            FunctionExpression(node) {
                check(node)
            },
            ArrowFunctionExpression(node) {
                check(node)
            },
        }
    }
}

export default new NoCtxHttpContextParam()
