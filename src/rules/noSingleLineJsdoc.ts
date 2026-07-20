import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import type { NitpickerRuleDocs } from "@/lib/utils/createRule"
import { isJSDocComment } from "@/lib/utils/JSDoc"
import { nitpick } from "@/lib/utils/nitpick"

type Options = []
type MessageIds = "singleLine"

/**
 * Flags JSDoc comments (`/**`) that are written on a single line and expands
 * them into the multi-line form:
 * ```
 * /** blabla *​/  ->  /**
 *                     * blabla
 *                     *​/
 * ```
 */
class NoSingleLineJSDoc extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-single-line-jsdoc"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "layout",
        fixable: "code",
        docs: {
            description: "Require JSDoc comments to span multiple lines rather than sit on a single line.",
            recommended: true,
        },
        schema: [],
        messages: {
            singleLine: nitpick({
                problem: "This JSDoc comment is written on a single line.",
                why: "Multi-line JSDoc is easier to read, diff, and extend with additional tags, and is the house style.",
                fix: "Put the opening `/**`, the ` * ` content, and the closing `*/` each on their own line.",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        const { sourceCode } = context

        return {
            Program() {
                for (const comment of sourceCode.getAllComments()) {
                    // Only JSDoc comments (`/**`) that fit on one line
                    if (!isJSDocComment(comment)) continue
                    if (comment.loc.start.line !== comment.loc.end.line) continue

                    // Strip the leading `*` left over from `/**` and normalize
                    const content = comment.value.replace(/^\*/, "").trim()

                    // An empty JSDoc (`/** */`) has nothing to expand onto its
                    // own line, so it is left alone
                    if (content.length === 0) continue

                    context.report({
                        loc: comment.loc,
                        messageId: "singleLine",
                        fix(fixer) {
                            const indent = " ".repeat(comment.loc.start.column)
                            const expanded = `/**\n${indent} * ${content}\n${indent} */`
                            return fixer.replaceTextRange(comment.range, expanded)
                        },
                    })
                }
            },
        }
    }
}

export default new NoSingleLineJSDoc()
