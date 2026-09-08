import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { classFragments, joinFragments } from "@/lib/utils/classnames"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ tokens: Record<string, string> }]
type MessageIds = "paletteBypass"

// Unlike the rest of the design rules this one targets the primitives, since a
// variant map is where a component's semantic colors are declared
/**
 * Flags a semantic variant whose classes reach past the status tokens into the
 * raw palette, which is how a product ends up carrying two greens and two ambers
 * for one meaning, and how a change to the token leaves the variant behind.
 */
class NoPaletteBypass extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-palette-bypass"

    readonly defaultOptions: Options = [{ tokens: { ...CONSTANTS.DESIGN.STATUS_TOKENS } }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow a semantic variant using the raw color palette instead of a status token.",
            recommended: true,
            category: "design",
        },
        schema: [
            {
                type: "object",
                properties: {
                    tokens: {
                        type: "object",
                        additionalProperties: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            paletteBypass: nitpick({
                problem: "Semantic variant `{{variant}}` uses the raw palette (`{{class}}`) instead of a status token.",
                why: "The product then carries two colors for one meaning, and a change to the token leaves this variant behind",
                fix: "Use the status token, `{{token}}`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const tokens = options[0]?.tokens ?? CONSTANTS.DESIGN.STATUS_TOKENS

        /**
         * Reads a property's key as written, covering both the bare and the
         * quoted form.
         * @param property The property to read.
         * @returns The key name, or undefined for a computed or spread property.
         */
        const keyOf = (property: TSESTree.ObjectLiteralElement): string | undefined => {
            if (property.type !== "Property" || property.computed) return undefined
            if (property.key.type === "Identifier") return property.key.name
            if (property.key.type === "Literal" && typeof property.key.value === "string") return property.key.value

            return undefined
        }

        /**
         * Finds the value of a named property on an object literal.
         * @param node The object to search.
         * @param name The property name to find.
         * @returns The property's value, or undefined.
         */
        const propertyValue = (node: TSESTree.Node, name: string): TSESTree.Node | undefined => {
            if (node.type !== "ObjectExpression") return undefined

            const property = node.properties.find(
                (candidate): candidate is TSESTree.Property => keyOf(candidate) === name,
            )

            return property?.value
        }

        return {
            CallExpression(node) {
                if (node.callee.type !== "Identifier") return
                if (node.callee.name !== CONSTANTS.DESIGN.VARIANT_FACTORY) return

                const config = node.arguments.at(1)
                if (config === undefined) return

                const variants = propertyValue(config, "variants")
                if (variants === undefined) return

                const variant = propertyValue(variants, "variant")
                if (variant === undefined || variant.type !== "ObjectExpression") return

                for (const property of variant.properties) {
                    const name = keyOf(property)
                    if (name === undefined) continue

                    const token = tokens[name]
                    if (token === undefined) continue

                    const classes = joinFragments(
                        classFragments((property as TSESTree.Property).value, context.sourceCode.visitorKeys),
                    )
                    const match = CONSTANTS.DESIGN.RAW_PALETTE.exec(classes)
                    if (match === null) continue

                    context.report({
                        node: property,
                        messageId: "paletteBypass",
                        data: {
                            variant: name,
                            class: match[0],
                            token,
                        },
                    })
                }
            },
        }
    }
}

export default new NoPaletteBypass()
