import { ASTUtils, type TSESLint, type TSESTree } from "@typescript-eslint/utils"

/**
 * Builds the dotted path of a pure property access chain, i.e. one made only of
 * non-computed member accesses (with any `?.` or `!`) bottoming out at an
 * identifier or `this`, such as `auth.user!` or `menu.node.path`.
 * @param node The expression to inspect.
 * @returns The dotted path, e.g. `auth.user`, or `null` if the expression is not
 * a plain property access.
 */
export function propertyAccessPath(node: TSESTree.Expression): string | null {
    const properties: string[] = []
    let expression: TSESTree.Node = node

    while (true) {
        if (expression.type === "ChainExpression" || expression.type === "TSNonNullExpression") {
            expression = expression.expression
            continue
        }

        if (expression.type === "MemberExpression") {
            if (expression.computed) return null
            if (expression.property.type !== "Identifier") return null

            properties.unshift(expression.property.name)
            expression = expression.object
            continue
        }

        break
    }

    if (properties.length === 0) return null
    if (expression.type === "ThisExpression") return ["this", ...properties].join(".")
    if (expression.type === "Identifier") return [expression.name, ...properties].join(".")

    return null
}

/**
 * Checks whether an expression is nothing but a non-computed property access
 * chain (with any `?.` or `!`) bottoming out at an identifier or `this`, such as
 * `auth.user!` or `menu.node.path`.
 * @param node The expression to inspect.
 * @returns True if the expression is a plain property access.
 */
export function isPropertyAccessAlias(node: TSESTree.Expression): boolean {
    return propertyAccessPath(node) !== null
}

/**
 * Checks whether a binding is written to after its declaration, which makes an
 * alias of it a snapshot of the value at that point rather than a rename.
 * @param scope The scope the alias is declared in.
 * @param name The name of the source binding.
 * @returns True if the binding is reassigned somewhere.
 */
export function isReassigned(scope: TSESLint.Scope.Scope, name: string): boolean {
    const variable = ASTUtils.findVariable(scope, name)

    // An unresolved name is a global or an ambient declaration, so it is stable
    if (variable === null) return false

    const declarations = new Set<TSESTree.Node>(variable.defs.map(definition => definition.name))

    return variable.references.some(reference => reference.isWrite() && !declarations.has(reference.identifier))
}

/**
 * Checks whether a property path, or a prefix of it, is written to, which makes
 * an alias of that path a snapshot rather than a rename.
 * @param written The property paths written to in the file.
 * @param path The property path the alias reads.
 * @returns True if the path or one of its prefixes is written to.
 */
export function isPathWritten(written: ReadonlySet<string>, path: string): boolean {
    for (const target of written) {
        if (path === target || path.startsWith(`${target}.`)) return true
    }

    return false
}

/**
 * Checks whether an object pattern is nothing but plain shorthand properties,
 * i.e. `{ a, b }` with no rename, default, computed key, or rest element, which
 * makes it a pure alias of the object it destructures.
 * @param pattern The object pattern to inspect.
 * @returns True if every property is a pure shorthand grab.
 */
export function isAllShorthand(pattern: TSESTree.ObjectPattern): boolean {
    if (pattern.properties.length === 0) return false

    return pattern.properties.every(
        property =>
            property.type === "Property" &&
            property.shorthand &&
            !property.computed &&
            property.value.type === "Identifier",
    )
}
