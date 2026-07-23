import type { TSESTree } from "@typescript-eslint/utils"

/**
 * Checks whether an expression is nothing but a property access, i.e. a chain of
 * non-computed member accesses (with any `?.` or trailing `!`) that bottoms out
 * at an identifier or `this`, such as `auth.user!` or `menu.node.path`.
 *
 * Computed access (`arr[0]`), calls (`obj.method()`), and bare identifiers are
 * not property-access aliases.
 * @param node The expression to inspect.
 * @returns `true` if the expression is a plain property access.
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
