import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { isPathWritten, isReassigned, propertyAccessPath } from "@/lib/utils/aliases"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "propertyAccessAlias"

/**
 * A `const` that reads like a property alias, held back until the whole file has
 * been walked so writes to the same property can exempt it.
 */
type Candidate = {
    /**
     * The declarator to report.
     */
    node: TSESTree.VariableDeclarator

    /**
     * The name the property is aliased under.
     */
    name: string

    /**
     * The dotted path the alias reads, e.g. `auth.user`.
     */
    path: string

    /**
     * The source text of the aliased expression.
     */
    expression: string
}

/**
 * Flags a `const` whose entire value is a single property access, such as
 * `const user = auth.user!`, since it just renames a property. `let`, exported
 * bindings, annotated declarations, and snapshots of a value written to later are
 * exempt.
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
        const candidates: Candidate[] = []
        const written = new Set<string>()

        /**
         * Tracks a property the file writes to, so an alias taken before one of
         * those writes is understood as a snapshot.
         * @param target The assignment target to record.
         */
        const recordWrite = (target: TSESTree.Node): void => {
            if (target.type !== "MemberExpression") return

            const path = propertyAccessPath(target)
            if (path !== null) written.add(path)
        }

        return {
            AssignmentExpression(node) {
                recordWrite(node.left)
            },

            UpdateExpression(node) {
                recordWrite(node.argument)
            },

            VariableDeclarator(node) {
                if (node.parent.type !== "VariableDeclaration" || node.parent.kind !== "const") return

                // Exported bindings cannot be inlined away, so they are exempt
                if (node.parent.parent.type === "ExportNamedDeclaration") return

                if (node.id.type !== "Identifier" || node.init === null) return

                // A type annotation is a reason of its own to keep the binding, as
                // inlining it would drop the narrowing it applies
                if (node.id.typeAnnotation !== undefined) return

                const path = propertyAccessPath(node.init)
                if (path === null) return

                // A reassigned root object makes this a snapshot of what it held
                // here, so inlining it would change what the code does
                const root = path.slice(0, path.indexOf("."))
                if (root !== "this" && isReassigned(context.sourceCode.getScope(node), root)) return

                candidates.push({
                    node,
                    name: node.id.name,
                    path,
                    expression: context.sourceCode.getText(node.init),
                })
            },

            "Program:exit"() {
                for (const candidate of candidates) {
                    if (isPathWritten(written, candidate.path)) continue

                    context.report({
                        node: candidate.node,
                        messageId: "propertyAccessAlias",
                        data: {
                            name: candidate.name,
                            expression: candidate.expression,
                        },
                    })
                }
            },
        }
    }
}

export default new NoPropertyAccessAlias()
