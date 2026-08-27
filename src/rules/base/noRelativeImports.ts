import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import { matchesGlob } from "@/lib/utils/regex"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ allowIn: string[] }]
type MessageIds = "relative"

/**
 * Flags a relative import or re-export specifier (`./` or `../`), so every
 * intra-package module is reached through its path alias instead. The `allowIn`
 * option lists globs (e.g. entrypoints) where relative paths are tolerated.
 */
class NoRelativeImports extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-relative-imports"

    readonly defaultOptions: Options = [{ allowIn: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow relative import and re-export specifiers, use the package path alias.",
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
            relative: nitpick({
                problem: "This import uses a relative path (`{{path}}`).",
                why: "A relative path breaks when a file moves and hides which package a module belongs to, the path alias is stable and explicit",
                fix: "Import through the package alias (`#...` or `@frontend/...`) instead of a relative path",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const allowIn = options[0]?.allowIn ?? []
        if (allowIn.length > 0 && matchesGlob(context.filename, allowIn)) {
            return {}
        }

        const check = (source: TSESTree.StringLiteral | null | undefined): void => {
            if (source === null || source === undefined) return
            if (!source.value.startsWith("./") && !source.value.startsWith("../")) return

            context.report({
                node: source,
                messageId: "relative",
                data: { path: source.value },
            })
        }

        return {
            ImportDeclaration(node) {
                check(node.source)
            },
            ExportNamedDeclaration(node) {
                check(node.source)
            },
            ExportAllDeclaration(node) {
                check(node.source)
            },
            ImportExpression(node) {
                if (node.source.type === "Literal" && typeof node.source.value === "string") {
                    check(node.source as TSESTree.StringLiteral)
                }
            },
        }
    }
}

export default new NoRelativeImports()
