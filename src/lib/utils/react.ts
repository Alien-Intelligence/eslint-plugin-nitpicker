import type { TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { type FunctionNode, getFunctionName, someReturn, type VisitorKeys } from "@/lib/utils/functions"

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
 * Checks whether a name is a React hook, i.e. `use` followed by a capitalized
 * word such as `useState` or `useMenuActions`.
 * @param name The function name to test.
 * @returns True if the name is a hook name.
 */
export function isHookName(name: string): boolean {
    return CONSTANTS.REACT.HOOK.test(name)
}

/**
 * Checks whether a name is a context-consumer hook, i.e. a `use…Context` wrapper
 * such as `useTreeViewContext` (the bare `useContext` is excluded).
 * @param name The function name to test.
 * @returns True if the name is a context-hook name.
 */
export function isContextHookName(name: string): boolean {
    return CONSTANTS.REACT.CONTEXT_HOOK.test(name)
}

/**
 * Checks whether an expression is, on its face, a function value: a function or
 * arrow expression, or a `useCallback` call (which always yields a function).
 * @param node The expression to inspect, if any.
 * @returns True if the expression evaluates to a function.
 */
export function isFunctionValue(node: TSESTree.Expression | null | undefined): boolean {
    if (!node) return false
    if (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") return true

    return node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "useCallback"
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

/**
 * Checks whether a function is a React component or a custom hook, the scopes
 * where `useMemo` is available and where local derivations should be memoized.
 * @param fn The function node to inspect.
 * @param visitorKeys The AST visitor keys, used to walk the function body.
 * @returns True if the function is a component or a hook.
 */
export function isComponentOrHook(fn: FunctionNode, visitorKeys: VisitorKeys): boolean {
    const name = getFunctionName(fn)
    if (name === undefined) return false

    return isHookName(name) || (isReactComponentName(name) && functionReturnsJsx(fn, visitorKeys))
}

/**
 * Checks whether an expression contains a non-hook call, without descending into
 * nested functions, so a value built by a helper or method call is caught but a
 * callback's inner calls are not.
 * @param node The AST node to search from.
 * @param visitorKeys The AST visitor keys, used to walk the subtree.
 * @returns True if a non-hook call is found.
 */
function hasNonHookCall(node: TSESTree.Node, visitorKeys: VisitorKeys): boolean {
    if (node.type === "CallExpression") {
        return !(node.callee.type === "Identifier" && isHookName(node.callee.name))
    }

    for (const key of visitorKeys[node.type] ?? []) {
        const value = (node as unknown as Record<string, unknown>)[key]
        const children = Array.isArray(value) ? value : [value]

        for (const child of children) {
            const childNode = child as TSESTree.Node | null | undefined
            if (!childNode || typeof childNode.type !== "string") continue
            if (CONSTANTS.FUNCTIONS.NODE_TYPES.has(childNode.type)) continue
            if (hasNonHookCall(childNode, visitorKeys)) return true
        }
    }

    return false
}

/**
 * Checks whether an expression is a derived value that belongs in a `useMemo`,
 * i.e. it computes something through a non-hook call. A function value (a
 * callback) and a bare hook result are not derived values.
 * @param node The expression to inspect.
 * @param visitorKeys The AST visitor keys, used to walk the expression.
 * @returns True if the expression is a derived value.
 */
export function isDerivedValue(node: TSESTree.Expression, visitorKeys: VisitorKeys): boolean {
    if (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") return false

    return hasNonHookCall(node, visitorKeys)
}
