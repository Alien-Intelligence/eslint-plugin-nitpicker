import type { TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import type { FunctionNode } from "@/lib/utils/functions"

/**
 * Checks whether a class is an AdonisJS controller, i.e. a default-exported
 * class whose name ends with `Controller`.
 * @param node The class declaration to inspect.
 * @returns True if the class is a controller.
 */
export function isControllerClass(node: TSESTree.ClassDeclaration): boolean {
    return node.parent.type === "ExportDefaultDeclaration" && node.id?.name.endsWith("Controller") === true
}

/**
 * Unwraps the wrappers a parameter can carry (a default value, a constructor
 * property modifier) down to the binding that holds the type annotation.
 * @param param The parameter node to unwrap.
 * @returns The innermost binding node.
 */
export function unwrapParam(param: TSESTree.Node): TSESTree.Node {
    if (param.type === "AssignmentPattern") return unwrapParam(param.left)
    if (param.type === "TSParameterProperty") return unwrapParam(param.parameter)

    return param
}

/**
 * Reads the name a type annotation refers to.
 * @param annotation The type annotation to read.
 * @returns The referenced type name, or `undefined` for any other shape.
 */
function typeReferenceName(annotation: TSESTree.TSTypeAnnotation | undefined): string | undefined {
    if (annotation?.typeAnnotation.type !== "TSTypeReference") return undefined
    if (annotation.typeAnnotation.typeName.type !== "Identifier") return undefined

    return annotation.typeAnnotation.typeName.name
}

/**
 * Checks whether a parameter is annotated as the AdonisJS `HttpContext`, whether
 * it binds the context whole (`ctx: HttpContext`) or destructures it
 * (`{ auth, request }: HttpContext`).
 * @param param The parameter node to inspect.
 * @returns True if the parameter is typed as the HTTP context.
 */
export function isHttpContextParam(param: TSESTree.Node): boolean {
    if (param.type !== "Identifier" && param.type !== "ObjectPattern") return false
    return typeReferenceName(param.typeAnnotation) === CONSTANTS.REQUEST.HTTP_CONTEXT_TYPE
}

/**
 * Checks whether a function is a route handler, i.e. it takes the AdonisJS
 * `HttpContext` in any of its parameters.
 * @param fn The function to inspect.
 * @returns True if the function receives the HTTP context.
 */
export function takesHttpContext(fn: FunctionNode): boolean {
    return fn.params.some(param => isHttpContextParam(unwrapParam(param)))
}
