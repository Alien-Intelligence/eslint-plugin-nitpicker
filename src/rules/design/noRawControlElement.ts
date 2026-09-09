import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import { matchesGlob } from "@/lib/utils/regex"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ elements: string[]; allowIn: string[] }]
type MessageIds = "rawControl"

// A hidden file input behind a styled trigger is the honest exception, and belongs
// in "allowIn" rather than being tolerated silently
/**
 * Flags a bare HTML form control in JSX where the design system ships a
 * primitive carrying the focus ring, disabled treatment, sizing and invalid
 * state that a raw element gets none of. The gap shows up only under keyboard
 * navigation.
 */
class NoRawControlElement extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-raw-control-element"

    readonly defaultOptions: Options = [{ elements: [...CONSTANTS.DESIGN.RAW_CONTROLS], allowIn: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow bare HTML form controls in JSX, use the design-system primitive.",
            recommended: true,
            category: "design",
        },
        schema: [
            {
                type: "object",
                properties: {
                    elements: {
                        type: "array",
                        items: { type: "string" },
                    },
                    allowIn: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            rawControl: nitpick({
                problem: "`<{{element}}>` is used directly instead of the design-system primitive.",
                why: "The primitive carries the focus ring, disabled treatment and invalid state, none of which a raw element gets",
                fix: "Use the `{{replacement}}` primitive instead",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const elements = new Set(options[0]?.elements ?? CONSTANTS.DESIGN.RAW_CONTROLS)
        const allowIn = options[0]?.allowIn ?? []
        if (allowIn.length > 0 && matchesGlob(context.filename, allowIn)) {
            return {}
        }

        return {
            JSXOpeningElement(node) {
                if (node.name.type !== "JSXIdentifier") return
                if (!elements.has(node.name.name)) return

                context.report({
                    node,
                    messageId: "rawControl",
                    data: {
                        element: node.name.name,
                        // The primitive carries the tag's own name, capitalized
                        replacement: node.name.name.charAt(0).toUpperCase() + node.name.name.slice(1),
                    },
                })
            },
        }
    }
}

export default new NoRawControlElement()
