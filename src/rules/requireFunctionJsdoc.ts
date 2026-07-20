import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import type { NitpickerRuleDocs } from "@/lib/utils/createRule"
import { type FunctionNode, getDocumentableNode, getFunctionName, isTopLevel } from "@/lib/utils/functions"
import { hasLeadingJSDoc } from "@/lib/utils/JSDoc"
import { nitpick } from "@/lib/utils/nitpick"
import { functionReturnsJsx, isReactComponentName } from "@/lib/utils/react"

type Options = []
type MessageIds = "missingJSDoc"

/**
 * Requires a JSDoc comment on top-level functions, with React component
 * functions (`PascalCase` name returning JSX) being the sole exception.
 */
class RequireFunctionJSDoc extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-function-jsdoc"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a JSDoc comment on top-level functions, except React component functions.",
            recommended: true,
        },
        schema: [],
        messages: {
            missingJSDoc: nitpick({
                problem: "The function `{{name}}` has no JSDoc comment.",
                why: "Top-level functions must document their purpose, parameters, and return value, React component functions are the only exception.",
                fix: "Add a `/** ... */` JSDoc block immediately above the function describing what it does.",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        const { sourceCode } = context

        const check = (fn: FunctionNode, reportNode: TSESTree.Node): void => {
            const name = getFunctionName(fn)
            // Anonymous functions (e.g `export default () => {}`) are skipped
            if (name === undefined) return

            const documentable = getDocumentableNode(fn)
            if (!isTopLevel(documentable)) return

            // React component functions are exempt from the JSDoc requirement
            if (isReactComponentName(name) && functionReturnsJsx(fn, sourceCode.visitorKeys)) return

            if (hasLeadingJSDoc(sourceCode, documentable)) return

            context.report({
                node: reportNode,
                messageId: "missingJSDoc",
                data: { name },
            })
        }

        return {
            FunctionDeclaration(node) {
                check(node, node.id ?? node)
            },
            VariableDeclarator(node) {
                const { init } = node
                if (!init) return
                if (init.type !== "ArrowFunctionExpression" && init.type !== "FunctionExpression") return

                check(init, node.id)
            },
        }
    }
}

export default new RequireFunctionJSDoc()
