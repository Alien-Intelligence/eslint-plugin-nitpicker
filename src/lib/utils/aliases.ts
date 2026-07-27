import type { TSESTree } from "@typescript-eslint/utils"

/**
 * Checks whether an expression is nothing but a non-computed property access
 * chain (with any `?.` or `!`) bottoming out at an identifier or `this`, such as
 * `auth.user!` or `menu.node.path`.
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
