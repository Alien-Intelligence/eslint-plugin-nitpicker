import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "jsxComment"

/**
 * Flags an inline comment placed inside JSX (a `{ }` container holding only a
 * comment), which usually labels a section that should be its own named
 * component rather than a prose marker.
 */
class NoJSXComments extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-jsx-comments"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow inline `{/* ... */}` comments inside JSX.",
            recommended: true,
            category: "react",
        },
        schema: [],
        messages: {
            jsxComment: nitpick({
                problem: "This JSX holds an inline `{/* ... */}` comment.",
                why: "A comment labeling a JSX section is a sign it should be its own named component, JSX should read as structure, not carry prose markers",
                fix: "Extract the section into a named sub-component whose name says what the comment said, or drop the comment",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            JSXExpressionContainer(node) {
                // Only a comment-only JSX container parses its inner expression as
                // empty, an ordinary value container never does
                if (node.expression.type !== "JSXEmptyExpression") return
                if (context.sourceCode.getCommentsInside(node).length === 0) return

                context.report({ node, messageId: "jsxComment" })
            },
        }
    }
}

export default new NoJSXComments()
