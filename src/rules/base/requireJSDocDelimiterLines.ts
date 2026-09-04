import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { isJSDocComment } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "openingLine" | "closingLine"

/**
 * Flags a multi-line JSDoc that shares its opening or closing delimiter line with
 * prose, so every block reads as an aligned column of ` * ` lines between a bare
 * opener and a bare closer.
 */
class RequireJSDocDelimiterLines extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-jsdoc-delimiter-lines"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "layout",
        fixable: "whitespace",
        docs: {
            description: "Require a JSDoc's opening and closing delimiters to sit on their own lines.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            openingLine: nitpick({
                problem: "This JSDoc starts its text on the same line as the opening delimiter.",
                why: "A block that opens mid-line breaks the aligned column of markers and reads unevenly",
                fix: "Move the text to the next line so the opening delimiter sits alone",
            }),
            closingLine: nitpick({
                problem: "This JSDoc ends its text on the same line as the closing delimiter.",
                why: "A block that closes mid-line breaks the aligned column of markers and reads unevenly",
                fix: "Move the closing delimiter onto its own line below the text",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        /**
         * Reports a JSDoc whose delimiters share a line with prose.
         * @param comment The JSDoc comment to inspect.
         */
        const check = (comment: TSESTree.Comment): void => {
            // A single-line JSDoc is "no-single-line-jsdoc"'s business, not this rule's
            if (comment.loc.start.line === comment.loc.end.line) return

            const segments = comment.value.split("\n")
            const indent = " ".repeat(comment.loc.start.column)

            // "comment.value" keeps the "*" of the opener, so anything after it is text
            const opening = (segments[0] ?? "").replace(/^\*/, "")
            if (opening.trim() !== "") {
                const start = comment.range[0] + 3
                const spacer = opening.startsWith(" ") ? "" : " "

                context.report({
                    loc: {
                        start: comment.loc.start,
                        end: context.sourceCode.getLocFromIndex(start + opening.length),
                    },
                    messageId: "openingLine",
                    fix: fixer => fixer.insertTextBeforeRange([start, start], `\n${indent} *${spacer}`),
                })
            }

            const closing = (segments.at(-1) ?? "").replace(/^\s*\*?/, "")
            if (closing.trim() !== "") {
                const end = comment.range[1] - 2

                context.report({
                    loc: {
                        start: context.sourceCode.getLocFromIndex(end),
                        end: comment.loc.end,
                    },
                    messageId: "closingLine",
                    fix: fixer => fixer.insertTextBeforeRange([end, end], `\n${indent} `),
                })
            }
        }

        return {
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    if (isJSDocComment(comment)) check(comment)
                }
            },
        }
    }
}

export default new RequireJSDocDelimiterLines()
