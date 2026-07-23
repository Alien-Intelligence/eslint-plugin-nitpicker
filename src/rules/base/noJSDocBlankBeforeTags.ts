import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import type { NitpickerRuleDocs } from "@/lib/utils/createRule"
import { isBlankJSDocLine, isJSDocComment, isJSDocTagLine } from "@/lib/utils/JSDoc"
import { nitpick } from "@/lib/utils/nitpick"

type Options = []
type MessageIds = "blankBeforeTag"

/**
 * Flags blank lines that sit between a JSDoc description and its tags (or
 * between tags) and removes them so the tags follow on directly.
 */
class NoJSDocBlankBeforeTags extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-jsdoc-blank-before-tags"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "layout",
        fixable: "code",
        docs: {
            description: "Disallow blank lines before JSDoc tags such as `@param` or `@returns`.",
            recommended: true,
        },
        schema: [],
        messages: {
            blankBeforeTag: nitpick({
                problem: "There is a blank line before a JSDoc tag.",
                why: "Tags should follow the description directly; an empty line there is noise that inflates the comment.",
                fix: "Remove the blank line so the tag follows on directly.",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        const { sourceCode } = context

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    if (!isJSDocComment(comment)) continue

                    if (comment.loc.start.line === comment.loc.end.line) continue

                    for (let line = comment.loc.start.line; line <= comment.loc.end.line; line++) {
                        const text = sourceCode.lines[line - 1]
                        if (text === undefined || !isBlankJSDocLine(text)) continue

                        // Grow the run of consecutive blank lines
                        let runEnd = line
                        while (runEnd < comment.loc.end.line && isBlankJSDocLine(sourceCode.lines[runEnd] ?? "")) {
                            runEnd++
                        }

                        // Only a blank run immediately before a tag is a problem
                        const nextLine = sourceCode.lines[runEnd]
                        if (nextLine !== undefined && isJSDocTagLine(nextLine)) {
                            const from = sourceCode.getIndexFromLoc({ line, column: 0 })
                            const to = sourceCode.getIndexFromLoc({ line: runEnd + 1, column: 0 })

                            context.report({
                                loc: {
                                    start: { line, column: 0 },
                                    end: { line: runEnd, column: text.length },
                                },
                                messageId: "blankBeforeTag",
                                fix: fixer => fixer.removeRange([from, to]),
                            })
                        }

                        line = runEnd
                    }
                }
            },
        }
    }
}

export default new NoJSDocBlankBeforeTags()
