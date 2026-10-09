import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
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
 * Checks whether a call renders a list, i.e. a `.map` or `.flatMap` whose
 * callback returns JSX, as in `rows.map(row => <Row />)`.
 * @param node The call to inspect.
 * @param visitorKeys The AST visitor keys, used to walk the callback body.
 * @returns True if the call yields a list of JSX elements.
 */
function isListRender(node: TSESTree.CallExpression, visitorKeys: VisitorKeys): boolean {
    if (node.callee.type !== "MemberExpression" || node.callee.property.type !== "Identifier") return false
    if (node.callee.computed || !CONSTANTS.REACT.LIST_METHODS.has(node.callee.property.name)) return false

    const callback = node.arguments[0]
    if (callback?.type !== "ArrowFunctionExpression" && callback?.type !== "FunctionExpression") return false

    return functionReturnsJsx(callback, visitorKeys)
}

/**
 * Checks whether an expression evaluates to JSX, following the branches a
 * component commonly returns through (ternaries, `&&`, comma sequences) and
 * the lists it renders (array literals, `.map` and `.flatMap` calls).
 * @param node The expression to inspect, if any.
 * @param visitorKeys The AST visitor keys, used to walk a list callback's body.
 * @returns True if the expression can produce a JSX element or fragment.
 */
export function isJsxExpression(node: TSESTree.Expression | null | undefined, visitorKeys: VisitorKeys): boolean {
    if (!node) return false

    switch (node.type) {
        case "JSXElement":
        case "JSXFragment":
            return true
        case "ConditionalExpression":
            return isJsxExpression(node.consequent, visitorKeys) || isJsxExpression(node.alternate, visitorKeys)
        case "LogicalExpression":
            return isJsxExpression(node.left, visitorKeys) || isJsxExpression(node.right, visitorKeys)
        case "SequenceExpression":
            return isJsxExpression(node.expressions.at(-1), visitorKeys)
        case "ArrayExpression":
            return node.elements.some(
                element => element?.type !== "SpreadElement" && isJsxExpression(element, visitorKeys),
            )
        case "ChainExpression":
            return isJsxExpression(node.expression, visitorKeys)
        case "CallExpression":
            return isListRender(node, visitorKeys)
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
        return isJsxExpression(fn.body, visitorKeys)
    }

    return someReturn(fn.body, visitorKeys, argument => isJsxExpression(argument, visitorKeys))
}

/**
 * Checks whether a function is a React component, i.e. a `PascalCase` function
 * that returns JSX.
 * @param fn The function node to inspect.
 * @param visitorKeys The AST visitor keys, used to walk the function body.
 * @returns True if the function is a component.
 */
export function isComponentFunction(fn: FunctionNode, visitorKeys: VisitorKeys): boolean {
    const name = getFunctionName(fn)
    if (name === undefined) return false

    return isReactComponentName(name) && functionReturnsJsx(fn, visitorKeys)
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

    return isHookName(name) || isComponentFunction(fn, visitorKeys)
}

/**
 * Resolves the type a component's props are annotated with, i.e. the type of its
 * first parameter, whether bound whole or destructured.
 * @param fn The component function to inspect.
 * @returns The props type, or `null` when the props are unannotated.
 */
export function getPropsType(fn: FunctionNode): TSESTree.TypeNode | null {
    const param = fn.params[0]
    if (param === undefined || param.type === "TSParameterProperty") return null

    const binding = param.type === "AssignmentPattern" ? param.left : param

    return binding.typeAnnotation?.typeAnnotation ?? null
}

/**
 * Resolves the name a type reference is written with, reading the last segment of
 * a qualified name, so `React.PropsWithChildren` reads as `PropsWithChildren`.
 * @param type The type reference to name.
 * @returns The referenced name.
 */
function typeReferenceName(type: TSESTree.TSTypeReference): string {
    if (type.typeName.type === "TSQualifiedName") return type.typeName.right.name

    return type.typeName.type === "Identifier" ? type.typeName.name : ""
}

/**
 * Resolves the named type a component's props are declared with, looking through
 * the wrappers that pass a props type through unchanged, e.g. `Readonly<…>`.
 * @param fn The component function to inspect.
 * @returns The type name, or `null` when the props are not one named type.
 */
export function getPropsTypeName(fn: FunctionNode): TSESTree.Identifier | null {
    let type = getPropsType(fn)

    while (type?.type === "TSTypeReference" && CONSTANTS.REACT.PROPS_WRAPPERS.has(typeReferenceName(type))) {
        type = type.typeArguments?.params[0] ?? null
    }

    if (type?.type !== "TSTypeReference" || type.typeName.type !== "Identifier") return null

    return type.typeName
}

/**
 * Checks whether a file opts into being a Client Component through a top-level
 * `"use client"` directive.
 * @param sourceCode The source code of the linted file.
 * @returns True if the file declares itself a Client Component.
 */
export function hasClientDirective(sourceCode: Readonly<TSESLint.SourceCode>): boolean {
    for (const statement of sourceCode.ast.body) {
        // The directive prologue ends at the first statement that is not one
        if (statement.type !== "ExpressionStatement" || statement.expression.type !== "Literal") return false
        if (statement.expression.value === CONSTANTS.REACT.CLIENT_DIRECTIVE) return true
    }

    return false
}

/**
 * Checks whether a file is a React Server Component, i.e. a Next.js App Router
 * entry file that has not opted into the client. No hook can run in one, so a
 * rule asking for a hook has nothing to ask for.
 * @param sourceCode The source code of the linted file.
 * @param filename The path of the linted file.
 * @returns True if the file renders on the server.
 */
export function isServerComponentFile(sourceCode: Readonly<TSESLint.SourceCode>, filename: string): boolean {
    if (!CONSTANTS.REACT.SERVER_FILE.test(filename.split("\\").join("/"))) return false

    return !hasClientDirective(sourceCode)
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
