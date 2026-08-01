import type { TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"

/**
 * A category a `createTable` builder statement falls into, used to keep a
 * migration's columns, timestamps, and indexes grouped in that order.
 */
export type TableCategory = "column" | "timestamp" | "index"

/**
 * Checks whether a class is an AdonisJS migration, i.e. a default-exported class
 * that extends `BaseSchema`.
 * @param node The class declaration to inspect.
 * @returns True if the class is a migration.
 */
export function isMigrationClass(node: TSESTree.ClassDeclaration): boolean {
    return (
        node.parent.type === "ExportDefaultDeclaration" &&
        node.superClass?.type === "Identifier" &&
        node.superClass.name === "BaseSchema"
    )
}

/**
 * Resolves the `this.schema.createTable(name, builder => { ... })` builder body
 * from a call expression, if the call is one.
 * @param node The call expression to inspect.
 * @returns The builder statements and parameter name, or `null`.
 */
export function getCreateTableBuilder(node: TSESTree.CallExpression): {
    body: TSESTree.Statement[]
    builderName: string
} | null {
    if (node.callee.type !== "MemberExpression" || node.callee.property.type !== "Identifier") return null
    if (node.callee.property.name !== "createTable") return null

    // Require a schema receiver so only Lucid migration calls match
    if (node.callee.object.type !== "MemberExpression" || node.callee.object.property.type !== "Identifier") return null
    if (node.callee.object.property.name !== "schema") return null

    const callback = node.arguments.at(-1)
    if (callback?.type !== "ArrowFunctionExpression" && callback?.type !== "FunctionExpression") return null
    if (callback.body.type !== "BlockStatement" || callback.params[0]?.type !== "Identifier") return null

    return { body: callback.body.body, builderName: callback.params[0].name }
}

/**
 * Resolves the category of a single `createTable` builder statement.
 * @param statement The statement to categorize.
 * @param builderName The name of the table builder parameter.
 * @returns The category, or `null` if the statement is not a builder call.
 */
export function getTableStatementCategory(statement: TSESTree.Statement, builderName: string): TableCategory | null {
    if (statement.type !== "ExpressionStatement") return null

    const root = rootBuilderCall(statement.expression, builderName)
    if (root === null) return null

    if (CONSTANTS.MIGRATIONS.INDEX_METHODS.has(root.method)) return "index"
    if (root.method === "timestamps") return "timestamp"
    if (
        CONSTANTS.MIGRATIONS.TIMESTAMP_METHODS.has(root.method) &&
        root.firstArgument !== undefined &&
        CONSTANTS.MIGRATIONS.AUDIT_TIMESTAMPS.has(root.firstArgument)
    ) {
        return "timestamp"
    }

    return "column"
}

/**
 * Walks a chained builder expression down to the first call on the builder, e.g.
 * `table.integer("x").notNullable()` resolves to `integer` with argument `"x"`.
 * @param expression The (possibly chained) expression to walk.
 * @param builderName The name of the table builder parameter.
 * @returns The base method and its first string argument, or `null`.
 */
function rootBuilderCall(
    expression: TSESTree.Expression,
    builderName: string,
): { method: string; firstArgument: string | undefined } | null {
    let current: TSESTree.Node = expression

    while (current.type === "CallExpression" && current.callee.type === "MemberExpression") {
        if (current.callee.object.type === "Identifier" && current.callee.object.name === builderName) {
            if (current.callee.property.type !== "Identifier") return null

            const firstArgument = current.arguments[0]
            const literal =
                firstArgument?.type === "Literal" && typeof firstArgument.value === "string"
                    ? firstArgument.value
                    : undefined

            return { method: current.callee.property.name, firstArgument: literal }
        }

        current = current.callee.object
    }

    return null
}
