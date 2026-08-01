import { ASTUtils, type TSESLint, type TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { type FunctionNode, getFunctionName, someReturn } from "@/lib/utils/functions"
import { nitpick } from "@/lib/utils/messages"
import { isFunctionValue, isHookName } from "@/lib/utils/react"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "wrapInObject"

/**
 * Flags a custom hook that returns a bare function (directly or through a local
 * `useCallback`), and wraps it in an object, so the hook can grow new members
 * later without breaking every call site.
 */
class RequireHookObjectReturn extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-hook-object-return"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Require a custom hook to return an object rather than a bare function.",
            recommended: true,
            category: "react",
        },
        schema: [],
        messages: {
            wrapInObject: nitpick({
                problem: "This hook returns a bare function instead of an object.",
                why: "Returning an object lets the hook expose new members later without changing every call site, a bare function locks its shape",
                fix: "Return the function inside an object, e.g. `return { handleThing }`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        // Whether a returned expression is a function, resolving a returned
        // identifier through its local declaration such as a `useCallback` const
        const returnsFunction = (argument: TSESTree.Expression): boolean => {
            if (isFunctionValue(argument)) return true
            if (argument.type !== "Identifier") return false

            const variable = ASTUtils.findVariable(context.sourceCode.getScope(argument), argument.name)
            const declarator = variable?.defs.at(-1)?.node
            return declarator?.type === "VariableDeclarator" && isFunctionValue(declarator.init)
        }

        const report = (argument: TSESTree.Expression): void => {
            context.report({
                node: argument,
                messageId: "wrapInObject",
                fix:
                    argument.type === "Identifier"
                        ? fixer => fixer.replaceText(argument, `{ ${argument.name} }`)
                        : undefined,
            })
        }

        const check = (fn: FunctionNode): void => {
            const name = getFunctionName(fn)
            if (name === undefined || !isHookName(name)) return

            // An arrow with an expression body returns that expression directly
            if (fn.type === "ArrowFunctionExpression" && fn.body.type !== "BlockStatement") {
                if (returnsFunction(fn.body)) report(fn.body)
                return
            }

            someReturn(fn.body, context.sourceCode.visitorKeys, argument => {
                if (argument !== null && returnsFunction(argument)) report(argument)
                return false
            })
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

export default new RequireHookObjectReturn()
