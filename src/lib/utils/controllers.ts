import type { TSESTree } from "@typescript-eslint/utils"

/**
 * Checks whether a class is an AdonisJS controller, i.e. a default-exported
 * class whose name ends with `Controller`.
 * @param node The class declaration to inspect.
 * @returns True if the class is a controller.
 */
export function isControllerClass(node: TSESTree.ClassDeclaration): boolean {
    return node.parent.type === "ExportDefaultDeclaration" && node.id?.name.endsWith("Controller") === true
}
