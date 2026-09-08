import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { classFragments } from "@/lib/utils/classnames"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ max: number }]
type MessageIds = "tooLong"

/**
 * Flags a class string in a `className` longer than the configured limit, so a
 * wall of Tailwind utilities gets broken into shorter pieces. A long string
 * inside a `cn(...)` call is caught too, since `cn` does not break it up.
 */
class MaxClassNameLength extends NitpickerRule<MessageIds, Options> {
    readonly name = "max-classname-length"

    readonly defaultOptions: Options = [{ max: CONSTANTS.REACT.MAX_CLASSNAME_LENGTH }]

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
        const max = options[0]?.max ?? CONSTANTS.REACT.MAX_CLASSNAME_LENGTH

        return {
            JSXAttribute(node) {
                if (node.name.type !== "JSXIdentifier" || node.name.name !== "className" || node.value === null) return

                // Only a whole class string has a meaningful length, one static piece of
                // an interpolated template says nothing about how long the string is
                const found = classFragments(node.value, context.sourceCode.visitorKeys).filter(
                    fragment => fragment.complete,
                )

                for (const { node: literal, text } of found) {
                    if (text.length <= max) continue

                    context.report({
                        node: literal,
                        messageId: "tooLong",
                        data: { length: text.length, max },
                    })
                }
            },
        }
    }
}

export default new MaxClassNameLength()
