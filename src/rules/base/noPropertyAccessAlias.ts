import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { isPropertyAccessAlias } from "@/lib/utils/aliases"
import type { NitpickerRuleDocs } from "@/lib/utils/createRule"
import { nitpick } from "@/lib/utils/nitpick"

type Options = []
type MessageIds = "propertyAccessAlias"

/**
 * Flags a `const` whose entire value is a single property access, such as
 * `const user = auth.user!`, since it just renames a property and hides where
 * the value comes from, `let` is exempt, as it may be reassigned later.
 */
class NoPropertyAccessAlias extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-property-access-alias"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description:
                "Disallow a `const` whose whole value is a single property access, inline the expression instead.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            propertyAccessAlias: nitpick({
                problem: "`{{name}}` only aliases the property access `{{expression}}`.",
                why: "A variable that just renames a property hides where the value comes from when scanning the code",
                fix: "Remove it and use `{{expression}}` inline, or use `let` if it is reassigned later",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        const { sourceCode } = context

        return {
            VariableDeclarator(node) {
                if (node.parent.type !== "VariableDeclaration" || node.parent.kind !== "const") return

                // Exported bindings cannot be inlined away, so they are exempt
                if (node.parent.parent.type === "ExportNamedDeclaration") return

                if (node.id.type !== "Identifier" || node.init === null) return
                if (!isPropertyAccessAlias(node.init)) return

                context.report({
                    node,
                    messageId: "propertyAccessAlias",
                    data: {
                        name: node.id.name,
                        expression: sourceCode.getText(node.init),
                    },
                })
            },
        }
    }
}

export default new NoPropertyAccessAlias()
