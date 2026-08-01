import type { TSESTree } from "@typescript-eslint/utils"

/**
 * Checks whether an expression is nothing but a non-computed property access
 * chain (with any `?.` or `!`) bottoming out at an identifier or `this`, such as
 * `auth.user!` or `menu.node.path`.
 * @param node The expression to inspect.
 * @returns True if the expression is a plain property access.
 */
export function isPropertyAccessAlias(node: TSESTree.Expression): boolean {
    let expression: TSESTree.Node = node
    let sawMemberAccess = false

    while (true) {
        if (expression.type === "ChainExpression" || expression.type === "TSNonNullExpression") {
            expression = expression.expression
            continue
        }

        if (expression.type === "MemberExpression") {
            if (expression.computed) return false

            sawMemberAccess = true
            expression = expression.object
            continue
        }

        break
    }

    return sawMemberAccess && (expression.type === "Identifier" || expression.type === "ThisExpression")
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
