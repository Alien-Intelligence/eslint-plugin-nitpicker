import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import { matchesGlob } from "@/lib/utils/regex"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ allowIn: string[] }]
type MessageIds = "rawColor"

/**
 * Flags a hex color literal, wherever it is written: a class string, a style
 * object, or any other string in the file. A literal cannot follow the theme and
 * is invisible to anyone auditing the palette.
 */
class NoRawColor extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-raw-color"

    readonly defaultOptions: Options = [{ allowIn: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow hex color literals, use a design-system token.",
            recommended: true,
            category: "design",
        },
        schema: [
            {
                type: "object",
                properties: {
                    allowIn: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            rawColor: nitpick({
                problem: "Raw color literal `{{value}}`.",
                why: "A literal cannot follow the theme and does not appear in any audit of the palette",
                fix: "Use a design-system token, via a utility class or `var(--token)`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        // A third-party brand mark is the honest exception, since a brand color
        // is not ours to tokenize, and naming it here keeps the rule credible
        const allowIn = options[0]?.allowIn ?? []
        if (allowIn.length > 0 && matchesGlob(context.filename, allowIn)) {
            return {}
        }

        return {
            Literal(node) {
                if (typeof node.value !== "string") return

                const match = CONSTANTS.DESIGN.HEX_COLOR.exec(node.value)
                if (match === null) return

                context.report({
                    node,
                    messageId: "rawColor",
                    data: { value: match[0] },
                })
            },

            TemplateElement(node) {
                const match = CONSTANTS.DESIGN.HEX_COLOR.exec(node.value.cooked ?? "")
                if (match === null) return

                context.report({
                    node,
                    messageId: "rawColor",
                    data: { value: match[0] },
                })
            },
        }
    }
}

export default new NoRawColor()
