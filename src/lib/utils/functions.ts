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

    // An object or class member is documented above the member, not the function
    if (node.parent.type === "Property" || node.parent.type === "MethodDefinition") {
        return node.parent
    }

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
 * A named thing a JSDoc `@param` can refer to.
 */
export type NamedParameter = { name: string; node: TSESTree.Node }

/**
 * How a parameter expects to be documented: a plain name, or a destructured
 * object, which may be documented either property by property or under a single
 * name standing for the whole object.
 */
export type ParameterDoc =
    | { kind: "name"; name: string; node: TSESTree.Node }
    | { kind: "object"; names: NamedParameter[]; node: TSESTree.Node }

/**
 * Checks whether a binding is deliberately ignored, i.e. named `_` or prefixed
 * with it, the convention for a name that exists only to hold a position.
 * @param name The binding name to test.
 * @returns True if the name marks an ignored binding.
 */
export function isIgnoredName(name: string): boolean {
    return name.startsWith("_")
}

/**
 * Describes how each parameter of a function expects to be documented. An array
 * pattern is skipped as too ambiguous to require, and so is an underscore-prefixed
 * name, which says the binding is there only to hold a position.
 * @param fn The function node to read the signature of.
 * @returns One entry per documentable parameter.
 */
export function parameterDocs(fn: FunctionNode): ParameterDoc[] {
    const docs: ParameterDoc[] = []

    /**
     * Adds the names a single parameter contributes, recursing through the
     * wrappers a parameter can carry.
     * @param param The parameter node to read.
     */
    const collect = (param: TSESTree.Node): void => {
        switch (param.type) {
            case "Identifier":
                if (isIgnoredName(param.name)) return

                docs.push({
                    kind: "name",
                    name: param.name,
                    node: param,
                })
                return
            case "AssignmentPattern":
                collect(param.left)
                return
            case "RestElement":
                collect(param.argument)
                return
            case "TSParameterProperty":
                collect(param.parameter)
                return
            case "ObjectPattern": {
                const names: NamedParameter[] = []
                for (const property of param.properties) {
                    if (property.type === "RestElement") {
                        if (property.argument.type === "Identifier" && !isIgnoredName(property.argument.name)) {
                            names.push({ name: property.argument.name, node: property.argument })
                        }
                    } else if (property.key.type === "Identifier" && !isIgnoredName(property.key.name)) {
                        names.push({ name: property.key.name, node: property.key })
                    }
                }

                if (names.length > 0) {
                    docs.push({
                        kind: "object",
                        names,
                        node: param,
                    })
                }

                return
            }
            default:
                return
        }
    }

    for (const param of fn.params) collect(param)

    return docs
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
 * Checks whether what a function hands back is opaque, i.e. a concise arrow body
 * that only forwards a call (`() => doThing()`) with no return-type annotation.
 * Syntax alone cannot say whether such a call yields a value or nothing.
 * @param fn The function node to inspect.
 * @returns True if the return value cannot be judged from the syntax.
 */
export function hasOpaqueReturn(fn: FunctionNode): boolean {
    if (fn.returnType) return false
    if (fn.type !== "ArrowFunctionExpression" || fn.body.type === "BlockStatement") return false

    const expression = fn.body.type === "AwaitExpression" ? fn.body.argument : fn.body

    return expression.type === "CallExpression"
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
