import type { TSESLint } from "@typescript-eslint/utils"
import { BRITISH_TO_AMERICAN } from "@/lib/data/britishToAmerican"
import { NitpickerRule } from "@/lib/rule"
import { buildDictionary } from "@/lib/utils/dictionaries"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"
import { extractWords, matchCase } from "@/lib/utils/words"

type Options = [{ extra: Record<string, string>; ignore: string[] }]
type MessageIds = "british"

/**
 * Flags British English spellings in identifiers and comments, reporting the
 * American equivalent. The built-in dictionary can be extended per project with
 * the `extra` option, or narrowed with `ignore`.
 */
class NoBritishEnglish extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-british-english"

    readonly defaultOptions: Options = [{ extra: {}, ignore: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow British English spellings in identifiers and comments.",
            recommended: true,
            category: "base",
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    extra: {
                        type: "object",
                        additionalProperties: { type: "string" },
                    },
                    ignore: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            british: nitpick({
                problem: "British spelling `{{british}}`, this codebase uses American English.",
                why: "One spelling convention keeps identifiers and docs consistent and searchable",
                fix: "Use `{{american}}` instead",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const dictionary = buildDictionary(BRITISH_TO_AMERICAN, options[0]?.extra ?? {}, options[0]?.ignore ?? [])

        return {
            Identifier(node) {
                // Skip a member's property name (an external read), it cannot be
                // renamed from here
                if (node.parent.type === "MemberExpression" && node.parent.property === node && !node.parent.computed) {
                    return
                }

                for (const word of extractWords(node.name)) {
                    const american = dictionary[word.text.toLowerCase()]
                    if (american === undefined) continue

                    context.report({
                        node,
                        messageId: "british",
                        data: { british: word.text, american: matchCase(word.text, american) },
                    })
                }
            },
            Program() {
                for (const comment of context.sourceCode.getAllComments()) {
                    for (const word of extractWords(comment.value)) {
                        const american = dictionary[word.text.toLowerCase()]
                        if (american === undefined) continue

                        const cased = matchCase(word.text, american)

                        // The comment value starts right after the "//" or "/*"
                        const from = comment.range[0] + 2 + word.index
                        const to = from + word.text.length

                        context.report({
                            loc: {
                                start: context.sourceCode.getLocFromIndex(from),
                                end: context.sourceCode.getLocFromIndex(to),
                            },
                            messageId: "british",
                            data: { british: word.text, american: cased },
                            fix: fixer => fixer.replaceTextRange([from, to], cased),
                        })
                    }
                }
            },
        }
    }
}

export default new NoBritishEnglish()
