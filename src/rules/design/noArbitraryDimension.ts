import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { classFragments, classNameAttribute } from "@/lib/utils/classnames"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ properties: string[] }]
type MessageIds = "arbitrary"

// A value that keeps recurring is a gap in the scale rather than carelessness,
// and wants a token adding rather than an exemption
/**
 * Flags a Tailwind arbitrary value given in px, such as `text-[10px]` or
 * `w-[774px]`. The scales exist so surfaces share a rhythm, and a one-off value
 * is a decision made once, in one place, that nothing else will follow.
 */
class NoArbitraryDimension extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-arbitrary-dimension"

    readonly defaultOptions: Options = [{ properties: [...CONSTANTS.DESIGN.SCALE_PROPERTIES] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow Tailwind arbitrary px values, which bypass the type and spacing scales.",
            recommended: true,
            category: "design",
        },
        schema: [
            {
                type: "object",
                properties: {
                    properties: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            arbitrary: nitpick({
                problem: "Arbitrary value `{{value}}` bypasses the scale.",
                why: "The type and spacing scales exist so surfaces share a rhythm, and a one-off value is followed by nothing else",
                fix: "Use the nearest step on the scale, or add a token if the value is genuinely needed twice",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const properties = options[0]?.properties ?? CONSTANTS.DESIGN.SCALE_PROPERTIES
        if (properties.length === 0) return {}

        const arbitrary = new RegExp(`\\b(?:${properties.join("|")})${CONSTANTS.DESIGN.ARBITRARY_PX.source}`, "g")

        return {
            JSXOpeningElement(node) {
                const attribute = classNameAttribute(node)
                if (attribute === undefined) return

                for (const fragment of classFragments(attribute.value, context.sourceCode.visitorKeys)) {
                    for (const match of fragment.text.matchAll(arbitrary)) {
                        context.report({
                            node: fragment.node,
                            messageId: "arbitrary",
                            data: { value: match[0] },
                        })
                    }
                }
            },
        }
    }
}

export default new NoArbitraryDimension()
