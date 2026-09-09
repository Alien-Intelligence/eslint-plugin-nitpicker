import type { TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import type { VisitorKeys } from "@/lib/utils/functions"

/**
 * One statically-known run of classes found inside a `className` value.
 */
export type ClassFragment = {
    /**
     * The node the fragment came from, so a report can point at it.
     */
    node: TSESTree.Node

    /**
     * The class text itself, with no interpolation resolved.
     */
    text: string

    /**
     * Whether the fragment is the whole class string rather than one static
     * piece of an interpolated template, which decides whether its length is a
     * meaningful measure of the string.
     */
    complete: boolean
}

/**
 * Collects the statically-known class runs inside a `className` value, reaching
 * through the `cn(...)`-style helpers and conditionals it is usually built from.
 * A nested function is not descended into, its classes belong to what it renders.
 * @param node The node to search from, typically a `JSXAttribute` value.
 * @param visitorKeys The AST visitor keys, used to walk the subtree.
 * @returns The fragments found, in source order.
 */
export function classFragments(node: TSESTree.Node | null | undefined, visitorKeys: VisitorKeys): ClassFragment[] {
    const found: ClassFragment[] = []

    /**
     * Walks one node, appending any class text it holds.
     * @param current The node to inspect.
     */
    const walk = (current: TSESTree.Node | null | undefined): void => {
        if (!current) return

        if (current.type === "Literal") {
            if (typeof current.value === "string")
                found.push({
                    node: current,
                    text: current.value,
                    complete: true,
                })
            return
        }

        if (current.type === "TemplateLiteral") {
            // With no interpolation the template is one whole class string, otherwise
            // each quasi is only a piece of one and its length says nothing
            const complete = current.expressions.length === 0

            for (const quasi of current.quasis) {
                const text = quasi.value.cooked ?? ""
                if (text.length > 0)
                    found.push({
                        node: complete ? current : quasi,
                        text,
                        complete,
                    })
            }

            return
        }

        for (const key of visitorKeys[current.type] ?? []) {
            const value = (current as unknown as Record<string, unknown>)[key]
            const children = Array.isArray(value) ? value : [value]

            for (const child of children) {
                const childNode = child as TSESTree.Node | null | undefined
                if (!childNode || typeof childNode.type !== "string") continue
                if (CONSTANTS.FUNCTIONS.NODE_TYPES.has(childNode.type)) continue
                walk(childNode)
            }
        }
    }

    walk(node)

    return found
}

/**
 * Joins every static class run of a `className` into one text, so a question
 * about which utilities an element carries can be answered across the pieces a
 * `cn(...)` call splits them into.
 * @param fragments The fragments to join.
 * @returns The joined class text.
 */
export function joinFragments(fragments: ClassFragment[]): string {
    return fragments.map(fragment => fragment.text).join(" ")
}

/**
 * Finds an element's `className` attribute, if it has one with a value.
 * @param node The JSX opening element to inspect.
 * @returns The `className` attribute, or undefined.
 */
export function classNameAttribute(node: TSESTree.JSXOpeningElement): TSESTree.JSXAttribute | undefined {
    return node.attributes.find(
        (attribute): attribute is TSESTree.JSXAttribute =>
            attribute.type === "JSXAttribute" &&
            attribute.name.type === "JSXIdentifier" &&
            attribute.name.name === "className" &&
            attribute.value !== null,
    )
}

/**
 * Reads the name of a JSX element, flattening the member and namespaced forms
 * so `Dialog.Content` reads as "Dialog.Content".
 * @param name The element name node.
 * @returns The name as written in the source.
 */
export function jsxElementName(name: TSESTree.JSXTagNameExpression): string {
    if (name.type === "JSXIdentifier") return name.name
    if (name.type === "JSXMemberExpression") return `${jsxElementName(name.object)}.${name.property.name}`

    return `${name.namespace.name}:${name.name.name}`
}
