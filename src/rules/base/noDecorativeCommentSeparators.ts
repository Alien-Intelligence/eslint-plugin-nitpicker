import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import type { NitpickerRuleDocs } from "@/lib/utils/createRule"
import { isDecorativeCommentLine } from "@/lib/utils/decoration"
import { matchesGlob } from "@/lib/utils/matchesGlob"
import { nitpick } from "@/lib/utils/nitpick"

type Options = [{ allowIn: string[] }]
type MessageIds = "decorative"

/**
 * Flags decorative separators inside comments, such as banner rules
 * (`// ======`), box-drawing lines, and labels fenced by repeated dashes
 * (`// -- Section --`). The `allowIn` option lists globs where they are
 * tolerated, which the AdonisJS config uses to permit banners in route files.
 */
class NoDecorativeCommentSeparators extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-decorative-comment-separators"

    readonly defaultOptions: Options = [{ allowIn: [] }]

    readonly meta = {
        type: "layout",
        docs: {
            description: "Disallow decorative separators (banners, box-drawing, repeated dashes) inside comments.",
            recommended: true,
            category: "base",
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
            decorative: nitpick({
                problem: "This comment uses a decorative separator.",
                why: "Repeated separator characters and box-drawing lines are visual noise that add nothing over a plain label",
                fix: "Remove the separator, a one-line label or a blank line already divides sections clearly",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const allowIn = options[0]?.allowIn ?? []
        if (allowIn.length > 0 && matchesGlob(context.filename, allowIn)) {
            return {}
        }

        const { sourceCode } = context

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    const lines = comment.value.split("\n")

                    for (let index = 0; index < lines.length; index++) {
                        const line = lines[index]
                        if (line === undefined || !isDecorativeCommentLine(line)) continue

                        const reportedLine = comment.loc.start.line + index
                        const source = sourceCode.lines[reportedLine - 1] ?? ""

                        context.report({
                            loc: {
                                start: { line: reportedLine, column: 0 },
                                end: { line: reportedLine, column: source.length },
                            },
                            messageId: "decorative",
                        })
                    }
                }
            },
        }
    }
}

export default new NoDecorativeCommentSeparators()
