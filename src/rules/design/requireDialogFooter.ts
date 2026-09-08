import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { jsxElementName } from "@/lib/utils/classnames"
import { nitpick } from "@/lib/utils/messages"
import { matchesGlob } from "@/lib/utils/regex"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ allowIn: string[] }]
type MessageIds = "missingFooter"

// The shadcn dialog primitives: the surface, the action row it owns, and the actions themselves
const CONTENT = "DialogContent"
const FOOTER = "DialogFooter"
const ACTION = "Button"

/**
 * Flags a `DialogContent` that renders a `Button` but no `DialogFooter`, so the
 * action row keeps the padding, alignment and button order the primitive owns
 * rather than each dialog choosing its own.
 */
class RequireDialogFooter extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-dialog-footer"

    readonly defaultOptions: Options = [{ allowIn: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a dialog's action buttons to live in a `DialogFooter`.",
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
            missingFooter: nitpick({
                problem: "This dialog has actions but no `DialogFooter`.",
                why: "The footer owns the action row's alignment and spacing, so hand-rolled rows drift apart across dialogs and move the confirm button between screens",
                fix: "Wrap the action buttons in `DialogFooter`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const allowIn = options[0]?.allowIn ?? []
        if (allowIn.length > 0 && matchesGlob(context.filename, allowIn)) {
            return {}
        }

        /**
         * Collects the names of every JSX element rendered below a node, without
         * leaving the subtree, so a sibling dialog cannot lend this one a footer.
         * @param node The node to search from.
         * @param names The names found, appended in place.
         */
        const collectNames = (node: TSESTree.Node, names: Set<string>): void => {
            if (node.type === "JSXOpeningElement") names.add(jsxElementName(node.name))

            for (const key of context.sourceCode.visitorKeys[node.type] ?? []) {
                const value = (node as unknown as Record<string, unknown>)[key]
                const children = Array.isArray(value) ? value : [value]

                for (const child of children) {
                    const childNode = child as TSESTree.Node | null | undefined
                    if (!childNode || typeof childNode.type !== "string") continue
                    collectNames(childNode, names)
                }
            }
        }

        return {
            JSXElement(node) {
                if (jsxElementName(node.openingElement.name) !== CONTENT) return

                const rendered = new Set<string>()
                for (const child of node.children) collectNames(child, rendered)

                if (!rendered.has(ACTION) || rendered.has(FOOTER)) return

                context.report({ node: node.openingElement, messageId: "missingFooter" })
            },
        }
    }
}

export default new RequireDialogFooter()
