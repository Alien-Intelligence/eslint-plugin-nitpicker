import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { getJSDocLineTag, hasLeadingJSDoc } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "missingJSDoc" | "missingParam"

/**
 * Requires a JSDoc above a `useMemo` or `useCallback` so a memoized value or
 * handler documents its purpose. A `useCallback` must also carry an `@param` per
 * parameter, since it is a function.
 */
class RequireMemoCallbackJSDoc extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-memo-callback-jsdoc"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a JSDoc on a useMemo or useCallback (with an `@param` per useCallback parameter).",
            recommended: true,
            category: "react",
        },
        schema: [],
        messages: {
            missingJSDoc: nitpick({
                problem: "This `{{hook}}` has no JSDoc.",
                why: "A memoized value or handler should document what it is, so its purpose is clear without reading the factory",
                fix: "Add a `/** ... */` JSDoc above the `const`",
            }),
            missingParam: nitpick({
                problem: "This `useCallback`'s JSDoc documents fewer parameters than the callback takes.",
                why: "A callback is a function, so each parameter it takes should be documented like any other",
                fix: "Add an `@param` line for each parameter of the callback",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            VariableDeclarator(node) {
                if (node.init?.type !== "CallExpression" || node.init.callee.type !== "Identifier") return
                if (!CONSTANTS.REACT.MEMO_HOOKS.has(node.init.callee.name)) return

                // The JSDoc sits above the whole declaration, or its export
                let target: TSESTree.Node = node.parent
                if (target.parent?.type === "ExportNamedDeclaration") target = target.parent

                if (!hasLeadingJSDoc(context.sourceCode, target)) {
                    context.report({
                        node: node.id,
                        messageId: "missingJSDoc",
                        data: { hook: node.init.callee.name },
                    })
                    return
                }

                if (node.init.callee.name !== "useCallback") return

                const callback = node.init.arguments[0]
                if (callback?.type !== "ArrowFunctionExpression" && callback?.type !== "FunctionExpression") return
                if (callback.params.length === 0) return

                const comment = context.sourceCode.getCommentsBefore(target).at(-1)
                const documented = (comment?.value.split("\n") ?? []).filter(
                    line => getJSDocLineTag(line) === "param",
                ).length

                if (documented < callback.params.length) {
                    context.report({ node: node.id, messageId: "missingParam" })
                }
            },
        }
    }
}

export default new RequireMemoCallbackJSDoc()
