import type { TSESTree } from "@typescript-eslint/utils"

/**
 * The AST node types that introduce a new function scope.
 */
const FUNCTION_NODE_TYPES = new Set<string>(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"])

/**
 * A lookup of AST node type to the property keys that hold its child nodes.
 */
type VisitorKeys = Record<string, readonly string[] | undefined>

/**
 * Checks whether a name follows the `PascalCase` convention React uses to
 * distinguish component functions from plain functions and DOM tags.
 * @param name The function name to test.
 * @returns `true` if the name starts with an uppercase letter.
 */
export function isReactComponentName(name: string): boolean {
    return /^[A-Z]/.test(name)
}

/**
 * Checks whether an expression evaluates to JSX, following the branches a
 * component commonly returns through (ternaries, `&&`, comma sequences).
 * @param node The expression to inspect, if any.
 * @returns `true` if the expression can produce a JSX element or fragment.
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
 * Recursively searches a subtree for a `return` that yields JSX, without
 * crossing into nested functions (whose returns belong to them, not us).
 * @param node The AST node to inspect.
 * @param visitorKeys The AST visitor keys, used to walk the subtree.
 */
function subtreeReturnsJsx(node: TSESTree.Node, visitorKeys: VisitorKeys): boolean {
    if (node.type === "ReturnStatement") {
        return isJsxExpression(node.argument)
    }

    for (const key of visitorKeys[node.type] ?? []) {
        const value = (node as unknown as Record<string, unknown>)[key]
        const children = Array.isArray(value) ? value : [value]

        for (const child of children) {
            const childNode = child as TSESTree.Node | null | undefined
            if (!childNode || typeof childNode.type !== "string") continue

            // Nested functions own their own returns, so stop descending there
            if (FUNCTION_NODE_TYPES.has(childNode.type)) continue
            if (subtreeReturnsJsx(childNode, visitorKeys)) return true
        }
    }

    return false
}

/**
 * Checks whether a function returns JSX, i.e. whether it looks like it renders
 * a React element.
 * @param fn The function node to inspect.
 * @param visitorKeys The AST visitor keys, used to walk the function body.
 * @returns True if the function returns JSX.
 */
export function functionReturnsJsx(
    fn: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
    visitorKeys: VisitorKeys,
): boolean {
    // An arrow with an expression body returns that expression directly
    if (fn.type === "ArrowFunctionExpression" && fn.body.type !== "BlockStatement") {
        return isJsxExpression(fn.body)
    }

    return subtreeReturnsJsx(fn.body, visitorKeys)
}
