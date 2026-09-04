import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { type FunctionNode, getDocumentableNode, isVoidFunction } from "@/lib/utils/functions"
import { findJSDocReturnsRange, isJSDocComment } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "voidReturns"

/**
 * Flags a `@returns` tag on a function that returns nothing (a void return type,
 * or a body with no `return` or only a bare `return`), and removes it, since it
 * documents a value that never exists.
 */
class NoJSDocReturnsOnVoid extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-jsdoc-returns-on-void"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow a JSDoc `@returns` tag on a function that returns nothing.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            voidReturns: nitpick({
                problem: "This function returns nothing, but its JSDoc has a `@returns` tag.",
                why: "A `@returns` on a void function documents a value that never exists and drifts from the code",
                fix: "Remove the `@returns` tag",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        /**
         * Reports a void function whose JSDoc still carries a returns tag.
         * @param fn The function to inspect.
         * @param anchor The node the JSDoc sits above.
         */
        const check = (fn: FunctionNode, anchor: TSESTree.Node): void => {
            const jsdoc = context.sourceCode.getCommentsBefore(anchor).at(-1)
            if (jsdoc === undefined || !isJSDocComment(jsdoc)) return

            const range = findJSDocReturnsRange(context.sourceCode, jsdoc)
            if (range === null) return
            if (!isVoidFunction(fn, context.sourceCode.visitorKeys)) return

            const from = context.sourceCode.getIndexFromLoc({ line: range.from, column: 0 })
            const to = context.sourceCode.getIndexFromLoc({ line: range.to + 1, column: 0 })

            context.report({
                loc: {
                    start: { line: range.from, column: 0 },
                    end: { line: range.to, column: (context.sourceCode.lines[range.to - 1] ?? "").length },
                },
                messageId: "voidReturns",
                fix: fixer => fixer.removeRange([from, to]),
            })
        }

        return {
            FunctionDeclaration(node) {
                check(node, getDocumentableNode(node))
            },
            VariableDeclarator(node) {
                if (node.init?.type === "ArrowFunctionExpression" || node.init?.type === "FunctionExpression") {
                    check(node.init, getDocumentableNode(node.init))
                }
            },
            MethodDefinition(node) {
                if (node.value.type === "FunctionExpression") {
                    check(node.value, node)
                }
            },
        }
    }
}

export default new NoJSDocReturnsOnVoid()
