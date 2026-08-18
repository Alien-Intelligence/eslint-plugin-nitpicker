import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

/**
 * A place an em dash may be tolerated, so user-facing copy, prompt text, and
 * glyphs can keep it while code and comments stay clean.
 */
type EmDashLocation = "strings" | "templates" | "jsx" | "comments"

type Options = [{ allow?: EmDashLocation[] }]
type MessageIds = "emDash"

/**
 * The token type each allowed location maps to, `comments` aside, as comments are
 * not tokens.
 */
const TOKEN_TYPES: Partial<Record<EmDashLocation, string>> = {
    strings: "String",
    templates: "Template",
    jsx: "JSXText",
}

/**
 * Flags every em dash (—) character found anywhere in the source, except in the
 * locations the `allow` option exempts.
 */
class NoEmDash extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-em-dash"

    readonly defaultOptions: Options = [{ allow: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow the em dash (—) character anywhere in the source.",
            recommended: true,
        },
        schema: [
            {
                type: "object",
                properties: {
                    allow: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["strings", "templates", "jsx", "comments"],
                        },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            emDash: nitpick({
                problem: "Found an em dash (—) character.",
                why: "Em dashes are typically introduced by AI-generated or auto-formatted text and are discouraged here.",
                fix: "Replace the em dash with a hyphen (-), a comma (,), or reword the sentence to avoid it, or allow it here with the rule's `allow` option if it is deliberate user-facing copy.",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const allow = new Set(options[0]?.allow ?? [])

        // The source spans an em dash may sit in without being reported, left empty
        // when nothing is allowed so the default scan stays exhaustive
        const exempt = (): [number, number][] => {
            const ranges: [number, number][] = []
            if (allow.size === 0) return ranges

            const tokenTypes = new Set(
                [...allow].map(location => TOKEN_TYPES[location]).filter(type => type !== undefined),
            )

            for (const token of context.sourceCode.ast.tokens ?? []) {
                if (tokenTypes.has(token.type)) ranges.push(token.range)
            }

            if (allow.has("comments")) {
                for (const comment of context.sourceCode.getAllComments()) {
                    ranges.push(comment.range)
                }
            }

            return ranges
        }

        return {
            Program() {
                const text = context.sourceCode.getText()
                const ranges = exempt()

                // Scan the raw source so every em dash is caught, whether it appears
                // in code, strings, or comments
                for (let index = 0; index < text.length; index++) {
                    if (text[index] !== CONSTANTS.EM_DASH) continue
                    if (ranges.some(([start, end]) => index >= start && index < end)) continue

                    context.report({
                        loc: {
                            start: context.sourceCode.getLocFromIndex(index),
                            end: context.sourceCode.getLocFromIndex(index + 1),
                        },
                        messageId: "emDash",
                    })
                }
            },
        }
    }
}

export default new NoEmDash()
