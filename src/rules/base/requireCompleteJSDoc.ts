import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { isHttpContextParam, takesHttpContext } from "@/lib/utils/controllers"
import {
    type FunctionNode,
    getDocumentableNode,
    hasOpaqueReturn,
    isVoidFunction,
    parameterDocs,
} from "@/lib/utils/functions"
import { getJSDocParamNames, getLeadingJSDoc, hasJSDocReturnsTag } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import { functionReturnsJsx } from "@/lib/utils/react"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "missingParam" | "missingReturns"

/**
 * Checks a function that already carries a JSDoc: every parameter must have an
 * `@param`, and a function returning a value must have a `@returns`. A void or
 * `Promise<void>` function needs no `@returns`, a component returning JSX is
 * exempt from it too.
 */
class RequireCompleteJSDoc extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-complete-jsdoc"
    readonly defaultOptions: Options = []
    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a function's JSDoc to document every parameter and its return value.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            missingParam: nitpick({
                problem: "The JSDoc does not document the parameter `{{name}}`.",
                why: "A JSDoc that skips a parameter drifts from the signature and stops describing what the function takes",
                fix: "Add an `@param {{name}} ...` line describing what it is",
            }),
            missingReturns: nitpick({
                problem: "The JSDoc has no `@returns`, but this function returns a value.",
                why: "A documented function should say what it hands back, a missing `@returns` leaves the caller guessing",
                fix: "Add a `@returns ...` line describing the value (a void or `Promise<void>` function needs none)",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    /**
     * Creates the rule listener.
     * @param context The rule context.
     * @returns The rule listener.
     */
    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        /**
         * Checks a documented function's tags against its signature.
         * @param fn The function to inspect.
         */
        const check = (fn: FunctionNode): void => {
            const jsdoc = getLeadingJSDoc(context.sourceCode, getDocumentableNode(fn))
            if (jsdoc === null) return

            const documented = getJSDocParamNames(jsdoc)
            const docs = parameterDocs(fn)
            const plainNames = new Set(docs.filter(doc => doc.kind === "name").map(doc => doc.name))

            for (const doc of docs) {
                // A destructured HttpContext names the context properties a route
                // handler uses, they are framework-supplied and never documented
                if (doc.kind === "object" && isHttpContextParam(doc.node)) continue

                if (doc.kind === "name") {
                    if (!documented.has(doc.name)) {
                        context.report({
                            node: doc.node,
                            messageId: "missingParam",
                            data: { name: doc.name },
                        })
                    }

                    continue
                }

                if (doc.names.every(entry => documented.has(entry.name))) continue

                // A destructured object may instead be documented under one name
                // standing for the whole object, e.g. "@param options"
                const properties = new Set(doc.names.map(entry => entry.name))
                const documentedAsWhole = [...documented].some(name => !properties.has(name) && !plainNames.has(name))
                if (documentedAsWhole) continue

                for (const entry of doc.names) {
                    if (documented.has(entry.name)) continue

                    context.report({
                        node: entry.node,
                        messageId: "missingParam",
                        data: { name: entry.name },
                    })
                }
            }

            if (hasJSDocReturnsTag(jsdoc)) return
            if (isVoidFunction(fn, context.sourceCode.visitorKeys)) return

            // A concise arrow forwarding a call says nothing about what it hands
            // back, and "no-jsdoc-returns-on-void" reads it the same way, so
            // neither rule has an opinion until a return type settles it
            if (hasOpaqueReturn(fn)) return

            // A route handler is documented route-first, a format that describes
            // the endpoint rather than the response object it hands back
            if (takesHttpContext(fn)) return

            // A component's render result is obvious, so it needs no "@returns"
            if (functionReturnsJsx(fn, context.sourceCode.visitorKeys)) return

            context.report({ node: jsdoc, messageId: "missingReturns" })
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

export default new RequireCompleteJSDoc()
