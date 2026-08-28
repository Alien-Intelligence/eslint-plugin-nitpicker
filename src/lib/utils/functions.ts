import type { TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"

/**
 * Any node that introduces a callable function.
 */
export type FunctionNode = TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression

/**
 * A lookup of AST node type to the property keys that hold its child nodes.
 */
export type VisitorKeys = Record<string, readonly string[] | undefined>

/**
 * Predicate applied to a `return` statement's argument (which is `null` for a
 * bare `return`).
 */
type ReturnPredicate = (argument: TSESTree.Expression | null) => boolean

/**
 * Resolves the node whose leading comments would document a function, walking
 * out through a variable declaration and/or an export statement (so
 * `export const foo = () => {}` resolves to the `export` node).
 * @param fn The function node to resolve from.
 * @returns The node a JSDoc comment would sit above.
 */
export function getDocumentableNode(fn: FunctionNode): TSESTree.Node {
    let node: TSESTree.Node = fn

    if (node.parent.type === "VariableDeclarator" && node.parent.parent.type === "VariableDeclaration") {
        node = node.parent.parent
    }

    if (node.parent.type === "ExportNamedDeclaration" || node.parent.type === "ExportDefaultDeclaration") {
        node = node.parent
    }

    return node
}

/**
 * Checks whether a node sits directly at the top level of the module.
 * @param node The node to test.
 * @returns True if the node's parent is the program root.
 */
export function isTopLevel(node: TSESTree.Node): boolean {
    return node.parent?.type === "Program"
}

/**
 * Resolves the nearest function a node sits inside, walking out through its
 * parents.
 * @param node The node to search from.
 * @returns The enclosing function, or `null` if the node is at module scope.
 */
export function enclosingFunction(node: TSESTree.Node): FunctionNode | null {
    // "node.parent" is typed undefined but is null at the Program root, so guard
    // with a truthy check to stop the walk on either
    let current: TSESTree.Node | undefined = node.parent

    while (current) {
        if (CONSTANTS.FUNCTIONS.NODE_TYPES.has(current.type)) {
            return current as FunctionNode
        }

        current = current.parent
    }

    return null
}

/**
 * Checks whether a function is a bare dynamic-import thunk, i.e.
 * `() => import("...")`, the lazy-loading pattern used for AdonisJS route
 * controllers and for code splitting.
 * @param fn The function node to inspect.
 * @returns True if the function only lazily imports a module.
 */
export function isDynamicImportThunk(fn: FunctionNode): boolean {
    return fn.type === "ArrowFunctionExpression" && fn.params.length === 0 && fn.body.type === "ImportExpression"
}

/**
 * Resolves the declared name of a function, whether it comes from the function
 * itself or the variable it is assigned to.
 * @param fn The function node to name.
 * @returns The function name, or `undefined` if it is anonymous.
 */
export function getFunctionName(fn: FunctionNode): string | undefined {
    if ((fn.type === "FunctionDeclaration" || fn.type === "FunctionExpression") && fn.id) {
        return fn.id.name
    }

    if (fn.parent.type === "VariableDeclarator" && fn.parent.id.type === "Identifier") {
        return fn.parent.id.name
    }

    return undefined
}

/**
 * Checks whether any `return` in a subtree satisfies a predicate, without
 * crossing into nested functions (whose returns belong to them, not us).
 * @param node The AST node to search from.
 * @param visitorKeys The AST visitor keys, used to walk the subtree.
 * @param predicate The test applied to each `return` argument.
 * @returns True if a matching `return` is found.
 */
export function someReturn(node: TSESTree.Node, visitorKeys: VisitorKeys, predicate: ReturnPredicate): boolean {
    if (node.type === "ReturnStatement") {
        return predicate(node.argument)
    }

    for (const key of visitorKeys[node.type] ?? []) {
        const value = (node as unknown as Record<string, unknown>)[key]
        const children = Array.isArray(value) ? value : [value]

        for (const child of children) {
            const childNode = child as TSESTree.Node | null | undefined
            if (!childNode || typeof childNode.type !== "string") continue
            if (CONSTANTS.FUNCTIONS.NODE_TYPES.has(childNode.type)) continue
            if (someReturn(childNode, visitorKeys, predicate)) return true
        }
    }

    return false
}

/**
 * Checks whether a function returns a value, i.e. an arrow with an expression
 * body or a body with a non-empty `return`.
 * @param fn The function node to inspect.
 * @param visitorKeys The AST visitor keys, used to walk the function body.
 * @returns True if the function returns a value.
 */
export function functionReturnsValue(fn: FunctionNode, visitorKeys: VisitorKeys): boolean {
    if (fn.type === "ArrowFunctionExpression" && fn.body.type !== "BlockStatement") {
        return true
    }

    return someReturn(fn.body, visitorKeys, argument => argument !== null)
}

/**
 * Checks whether a return-type annotation is `void` or `Promise<void>`.
 * @param annotation The return-type annotation to inspect.
 * @returns True if the annotation is a void type.
 */
export function isVoidReturnType(annotation: TSESTree.TSTypeAnnotation): boolean {
    if (annotation.typeAnnotation.type === "TSVoidKeyword") return true

    if (
        annotation.typeAnnotation.type === "TSTypeReference" &&
        annotation.typeAnnotation.typeName.type === "Identifier" &&
        annotation.typeAnnotation.typeName.name === "Promise"
    ) {
        return (
            annotation.typeAnnotation.typeArguments?.params.length === 1 &&
            annotation.typeAnnotation.typeArguments?.params[0]?.type === "TSVoidKeyword"
        )
    }

    return false
}

/**
 * Checks whether a function returns nothing, judged by its return-type
 * annotation when present, otherwise by its body.
 * @param fn The function node to inspect.
 * @param visitorKeys The AST visitor keys, used to walk the function body.
 * @returns True if the function is void.
 */
export function isVoidFunction(fn: FunctionNode, visitorKeys: VisitorKeys): boolean {
    if (fn.returnType) {
        return isVoidReturnType(fn.returnType)
    }

    return !functionReturnsValue(fn, visitorKeys)
}
