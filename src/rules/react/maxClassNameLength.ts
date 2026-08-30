import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ max: number }]
type MessageIds = "tooLong"

const DEFAULT_MAX = 120

/**
 * Flags a class string in a `className` longer than the configured limit, so a
 * wall of Tailwind utilities gets broken into shorter pieces. A long string
 * inside a `cn(...)` call is caught too, since `cn` does not break it up.
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

        // Collect the class strings inside a className value: string literals and
        // non-interpolated templates, including those nested in a cn(...) call,
        // without descending into a nested function
        const collect = (
            node: TSESTree.Node | null | undefined,
            found: { node: TSESTree.Node; text: string }[],
        ): void => {
            if (!node) return

            if (node.type === "Literal") {
                if (typeof node.value === "string") found.push({ node, text: node.value })
                return
            }

            if (node.type === "TemplateLiteral") {
                if (node.expressions.length === 0) found.push({ node, text: node.quasis[0]?.value.cooked ?? "" })
                return
            }

            for (const key of context.sourceCode.visitorKeys[node.type] ?? []) {
                const value = (node as unknown as Record<string, unknown>)[key]
                const children = Array.isArray(value) ? value : [value]

                for (const child of children) {
                    const childNode = child as TSESTree.Node | null | undefined
                    if (!childNode || typeof childNode.type !== "string") continue
                    if (CONSTANTS.FUNCTIONS.NODE_TYPES.has(childNode.type)) continue
                    collect(childNode, found)
                }
            }
        }

        return {
            JSXAttribute(node) {
                if (node.name.type !== "JSXIdentifier" || node.name.name !== "className" || node.value === null) return

                const found: { node: TSESTree.Node; text: string }[] = []
                collect(node.value, found)

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
