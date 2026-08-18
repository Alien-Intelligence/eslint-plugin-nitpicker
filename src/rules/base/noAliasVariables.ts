import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { isReassigned } from "@/lib/utils/aliases"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "alias"

/**
 * Flags a `const` whose entire value is another variable, such as
 * `const accessTokens = rawAccessTokens`, since it just renames the source. `let`,
 * exported bindings, annotated declarations, and snapshots of a reassigned source
 * are exempt.
 */
class NoAliasVariables extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-alias-variables"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow a `const` whose whole value is another variable, use the source directly.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            alias: nitpick({
                problem: "`{{name}}` only aliases `{{source}}`.",
                why: "A variable that just renames another hides the original and adds a name to track for no gain",
                fix: "Remove it and use `{{source}}` directly, or rename `{{source}}` itself if the new name is better",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            VariableDeclarator(node) {
                if (node.parent.type !== "VariableDeclaration" || node.parent.kind !== "const") return

                // Exported bindings cannot be inlined away, so they are exempt
                if (node.parent.parent.type === "ExportNamedDeclaration") return

                if (node.id.type !== "Identifier" || node.init?.type !== "Identifier") return

                // A type annotation is a reason of its own to keep the binding, as
                // inlining it would drop the narrowing it applies
                if (node.id.typeAnnotation !== undefined) return

                // A reassigned source makes this a snapshot of its value here, not
                // a rename, so inlining it would change what the code does
                if (isReassigned(context.sourceCode.getScope(node), node.init.name)) return

                context.report({
                    node,
                    messageId: "alias",
                    data: {
                        name: node.id.name,
                        source: node.init.name,
                    },
                })
            },
        }
    }
}

export default new NoAliasVariables()
