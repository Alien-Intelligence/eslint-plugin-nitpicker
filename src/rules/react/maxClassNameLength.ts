import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ max: number }]
type MessageIds = "tooLong"

const DEFAULT_MAX = 120

/**
 * Flags a `className` whose class string is longer than the configured limit, so
 * a wall of Tailwind utilities gets broken up (typically across `cn()` arguments
 * on their own lines) rather than living on one unreadable line.
 */
class MaxClassNameLength extends NitpickerRule<MessageIds, Options> {
    readonly name = "max-classname-length"

    readonly defaultOptions: Options = [{ max: DEFAULT_MAX }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Enforce a maximum length for a `className` class string.",
            recommended: true,
            category: "react",
        },
        schema: [
            {
                type: "object",
                properties: {
                    max: { type: "integer", minimum: 1 },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            tooLong: nitpick({
                problem: "This `className` string is {{length}} characters, over the {{max}}-character limit.",
                why: "A long wall of Tailwind classes is hard to scan and diff, and it overflows the line",
                fix: "Break the classes across multiple lines, grouping related ones into separate `cn()` arguments",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const max = options[0]?.max ?? DEFAULT_MAX

        // The class string of a "className" value when it is a single string
        // literal or a non-interpolated template, or "null" for anything richer
        const classString = (value: TSESTree.JSXAttribute["value"]): string | null => {
            if (value === null) return null
            if (value.type === "Literal") return typeof value.value === "string" ? value.value : null
            if (value.type !== "JSXExpressionContainer") return null

            if (value.expression.type === "Literal")
                return typeof value.expression.value === "string" ? value.expression.value : null
            if (value.expression.type === "TemplateLiteral" && value.expression.expressions.length === 0) {
                return value.expression.quasis[0]?.value.cooked ?? ""
            }

            return null
        }

        return {
            JSXAttribute(node) {
                if (node.name.type !== "JSXIdentifier" || node.name.name !== "className") return

                const classes = classString(node.value)
                if (classes === null || classes.length <= max || node.value === null) return

                context.report({
                    node: node.value,
                    messageId: "tooLong",
                    data: { length: classes.length, max },
                })
            },
        }
    }
}

export default new MaxClassNameLength()
