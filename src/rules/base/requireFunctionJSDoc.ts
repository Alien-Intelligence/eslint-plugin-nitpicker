import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import {
    type FunctionNode,
    getDocumentableNode,
    getFunctionName,
    isDynamicImportThunk,
    isTopLevel,
} from "@/lib/utils/functions"
import { hasLeadingJSDoc } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import { functionReturnsJsx, isReactComponentName } from "@/lib/utils/react"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

/**
 * The function kinds that can be required to carry a JSDoc on top of the
 * top-level functions the rule always checks.
 */
type Include = "class-methods" | "object-methods" | "nested"

type Options = [{ include: Include[]; ignore: string[] }]
type MessageIds = "missingJSDoc"

/**
 * Requires a JSDoc comment on top-level functions, plus whichever of class
 * methods, object-literal methods, and nested named functions the `include`
 * option asks for. React component functions are exempt.
 */
class RequireFunctionJSDoc extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-function-jsdoc"

    readonly defaultOptions: Options = [{ include: ["class-methods", "nested"], ignore: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a JSDoc comment on functions, except React component functions.",
            recommended: true,
        },
        schema: [
            {
                type: "object",
                properties: {
                    include: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["class-methods", "object-methods", "nested"],
                        },
                    },
                    ignore: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            missingJSDoc: nitpick({
                problem: "The function `{{name}}` has no JSDoc comment.",
                why: "A function must document its purpose, parameters, and return value, React component functions are the only exception",
                fix: "Add a `/** ... */` JSDoc block immediately above it describing what it does",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const include = new Set<Include>(options[0]?.include ?? ["class-methods", "nested"])

        // Names exempt from the requirement, for an inherited or framework member
        // whose purpose is fixed by the interface it implements
        const ignore = new Set(options[0]?.ignore ?? [])

        /**
         * Reports a function that carries no JSDoc, once the exemptions are applied.
         * @param fn The function to inspect.
         * @param documentable The node whose leading comments hold the JSDoc.
         * @param name The function's written name.
         * @param node The node to report on.
         */
        const report = (fn: FunctionNode, documentable: TSESTree.Node, name: string, node: TSESTree.Node): void => {
            if (ignore.has(name)) return

            // Lazy dynamic-import thunks carry no logic worth documenting
            if (isDynamicImportThunk(fn)) return

            // React component functions are exempt from the JSDoc requirement
            if (isReactComponentName(name) && functionReturnsJsx(fn, context.sourceCode.visitorKeys)) return

            if (hasLeadingJSDoc(context.sourceCode, documentable)) return

            context.report({
                node,
                messageId: "missingJSDoc",
                data: { name },
            })
        }

        /**
         * Checks a plain function or arrow const, at module scope always and deeper
         * only when nested functions are opted into.
         * @param fn The function to inspect.
         * @param node The node to report on.
         */
        const checkDeclared = (fn: FunctionNode, node: TSESTree.Node): void => {
            const name = getFunctionName(fn)
            if (name === undefined) return

            const documentable = getDocumentableNode(fn)

            // A member is handled by its own listener, not as a declaration
            if (documentable.type === "MethodDefinition" || documentable.type === "Property") return

            if (!isTopLevel(documentable) && !include.has("nested")) return

            report(fn, documentable, name, node)
        }

        /**
         * Resolves the written name of a class or object member.
         * @param key The member key to read.
         * @returns The name, or `undefined` for a key this rule cannot read.
         */
        const memberName = (key: TSESTree.Node): string | undefined => {
            if (key.type === "Identifier") return key.name
            if (key.type === "Literal" && typeof key.value === "string") return key.value

            return undefined
        }

        return {
            FunctionDeclaration(node) {
                checkDeclared(node, node.id ?? node)
            },
            VariableDeclarator(node) {
                if (!node.init) return
                if (node.init.type !== "ArrowFunctionExpression" && node.init.type !== "FunctionExpression") return

                checkDeclared(node.init, node.id)
            },
            MethodDefinition(node) {
                if (!include.has("class-methods") || node.computed) return
                if (node.value.type !== "FunctionExpression") return

                const name = memberName(node.key)
                if (name === undefined) return

                report(node.value, node, name, node.key)
            },
            Property(node) {
                if (!include.has("object-methods") || node.computed) return
                if (node.value.type !== "ArrowFunctionExpression" && node.value.type !== "FunctionExpression") return

                const name = memberName(node.key)
                if (name === undefined) return

                report(node.value, node, name, node.key)
            },
        }
    }
}

export default new RequireFunctionJSDoc()
