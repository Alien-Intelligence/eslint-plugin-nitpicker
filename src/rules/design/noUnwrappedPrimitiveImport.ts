import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import { matchesGlob } from "@/lib/utils/regex"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ wrapped: Record<string, Record<string, string>>; allowIn: string[] }]
type MessageIds = "unwrapped"

// Keyed on the symbol, not the package: a wrapper rarely re-exports everything
// its library does, so a package-level ban would drown the real finding
/**
 * Flags a symbol imported straight from a third-party package when the design
 * system ships a wrapper exporting that same name. Scope this away from the
 * wrapper layer itself, the one place the direct import belongs.
 */
class NoUnwrappedPrimitiveImport extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-unwrapped-primitive-import"

    readonly defaultOptions: Options = [{ wrapped: {}, allowIn: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow importing a symbol directly from a library when the design system wraps it.",
            recommended: true,
            category: "design",
        },
        schema: [
            {
                type: "object",
                properties: {
                    wrapped: {
                        type: "object",
                        additionalProperties: {
                            type: "object",
                            additionalProperties: { type: "string" },
                        },
                    },
                    allowIn: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unwrapped: nitpick({
                problem: "`{{symbol}}` is imported from `{{package}}`, but the design system wraps it.",
                why: "The wrapper is where the design tokens are applied, so the unwrapped import renders outside the system while looking almost correct",
                fix: "Import `{{symbol}}` from `{{replacement}}` instead",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const wrapped = options[0]?.wrapped ?? {}
        const allowIn = options[0]?.allowIn ?? []
        if (allowIn.length > 0 && matchesGlob(context.filename, allowIn)) {
            return {}
        }

        return {
            ImportDeclaration(node) {
                const symbols = wrapped[node.source.value]
                if (symbols === undefined) return

                for (const specifier of node.specifiers) {
                    if (specifier.type !== "ImportSpecifier") continue
                    if (specifier.imported.type !== "Identifier") continue

                    const replacement = symbols[specifier.imported.name]
                    if (replacement === undefined) continue

                    context.report({
                        node: specifier,
                        messageId: "unwrapped",
                        data: {
                            symbol: specifier.imported.name,
                            package: node.source.value,
                            replacement,
                        },
                    })
                }
            },
        }
    }
}

export default new NoUnwrappedPrimitiveImport()
