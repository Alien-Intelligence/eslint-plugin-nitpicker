import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { classFragments, classNameAttribute, joinFragments, jsxElementName } from "@/lib/utils/classnames"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "centered"

// The table cell primitives, header and body, whose alignment decides the column's
const CELLS = new Set(["TableHead", "TableCell"])

// The utility that takes a column off its shared edge
const CENTERED = /\btext-center\b/

/**
 * Flags a centered table column. A centered column has no shared edge, so the eye
 * has nothing to run down and the column stops being scannable, which is the
 * whole reason a table is faster to read than a list. Text goes left, numbers
 * right.
 */
class NoCenteredTableColumn extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-centered-table-column"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow centring a table column, text goes left and numbers right.",
            recommended: true,
            category: "design",
        },
        schema: [],
        messages: {
            centered: nitpick({
                problem: "Table column is centered.",
                why: "A centered column has no shared edge for the eye to follow, which is the whole reason a table is faster to read than a list",
                fix: "Left-align the text, or right-align it if the column holds numbers",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            JSXOpeningElement(node) {
                if (!CELLS.has(jsxElementName(node.name))) return

                const attribute = classNameAttribute(node)
                if (attribute === undefined) return

                const classes = joinFragments(classFragments(attribute.value, context.sourceCode.visitorKeys))
                if (!CENTERED.test(classes)) return

                context.report({ node: attribute, messageId: "centered" })
            },
        }
    }
}

export default new NoCenteredTableColumn()
