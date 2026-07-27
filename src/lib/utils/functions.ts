import type { TSESTree } from "@typescript-eslint/utils"

/**
 * Any node that introduces a callable function.
 */
export type FunctionNode = TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression

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
 * @returns `true` if the node's parent is the program root.
 */
export function isTopLevel(node: TSESTree.Node): boolean {
    return node.parent?.type === "Program"
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
