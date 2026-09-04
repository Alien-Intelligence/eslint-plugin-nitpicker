import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { getLeadingJSDoc } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "blankLine"

/**
 * Flags a documented interface or type-literal member that sits flush against
 * the member above it, so every documented member is separated by a blank line
 * and its JSDoc reads as belonging to it rather than to the line before.
 */
class RequireMemberJSDocBlankLine extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-member-jsdoc-blank-line"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "layout",
        fixable: "whitespace",
        docs: {
            description: "Require a blank line before a documented interface or type-literal member.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            blankLine: nitpick({
                problem: "This documented member sits flush against the member above it.",
                why: "Without a blank line the JSDoc reads as trailing the previous member, and the block becomes a wall of text",
                fix: "Add a blank line above the JSDoc (the first member of the block needs none)",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        /**
         * Reports every documented member that follows another one with no blank
         * line between them.
         * @param members The members of one interface or type literal.
         */
        const check = (members: TSESTree.TypeElement[]): void => {
            // The first member opens the block, so it needs nothing above it
            for (const member of members.slice(1)) {
                const jsdoc = getLeadingJSDoc(context.sourceCode, member)
                if (jsdoc === null) continue

                const above = context.sourceCode.lines[jsdoc.loc.start.line - 2]
                if (above === undefined || above.trim() === "") continue

                // Insert at the start of the JSDoc's own line so its indentation survives
                const lineStart = jsdoc.range[0] - jsdoc.loc.start.column

                context.report({
                    node: jsdoc,
                    messageId: "blankLine",
                    fix: fixer => fixer.insertTextBeforeRange([lineStart, lineStart], "\n"),
                })
            }
        }

        return {
            TSInterfaceBody(node) {
                check(node.body)
            },
            TSTypeLiteral(node) {
                check(node.members)
            },
        }
    }
}

export default new RequireMemberJSDocBlankLine()
