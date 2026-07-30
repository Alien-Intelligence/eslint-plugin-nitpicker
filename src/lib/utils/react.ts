import type { TSESTree } from "@typescript-eslint/utils"
import { type FunctionNode, someReturn, type VisitorKeys } from "@/lib/utils/functions"

/**
 * Checks whether a name follows the `PascalCase` convention React uses to
 * distinguish component functions from plain functions and DOM tags.
 * @param name The function name to test.
 * @returns True if the name starts with an uppercase letter.
 */
export function isReactComponentName(name: string): boolean {
    return /^[A-Z]/.test(name)
}

/**
 * Checks whether an expression evaluates to JSX, following the branches a
 * component commonly returns through (ternaries, `&&`, comma sequences).
 * @param node The expression to inspect, if any.
 * @returns True if the expression can produce a JSX element or fragment.
 */
export function isJsxExpression(node: TSESTree.Expression | null | undefined): boolean {
    if (!node) return false

    switch (node.type) {
        case "JSXElement":
        case "JSXFragment":
            return true
        case "ConditionalExpression":
            return isJsxExpression(node.consequent) || isJsxExpression(node.alternate)
        case "LogicalExpression":
            return isJsxExpression(node.left) || isJsxExpression(node.right)
        case "SequenceExpression":
            return isJsxExpression(node.expressions.at(-1))
        default:
            return false
    }
}

/**
 * Checks whether a function returns JSX, i.e. whether it looks like it renders
 * a React element.
 * @param fn The function node to inspect.
 * @param visitorKeys The AST visitor keys, used to walk the function body.
 * @returns True if the function returns JSX.
 */
export function functionReturnsJsx(fn: FunctionNode, visitorKeys: VisitorKeys): boolean {
    // An arrow with an expression body returns that expression directly
    if (fn.type === "ArrowFunctionExpression" && fn.body.type !== "BlockStatement") {
        return isJsxExpression(fn.body)
    }

    return someReturn(fn.body, visitorKeys, isJsxExpression)
}
