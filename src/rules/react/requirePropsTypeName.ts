import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { type FunctionNode, getFunctionName } from "@/lib/utils/functions"
import { nitpick } from "@/lib/utils/messages"
import { getPropsTypeName, isComponentFunction } from "@/lib/utils/react"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "propsTypeName"

/**
 * A component and the named type its props are declared with.
 */
type PropsUsage = {
    /**
     * The component's name.
     */
    component: string

    /**
     * The type name node the props are annotated with.
     */
    type: TSESTree.Identifier
}

/**
 * Requires a component's props type, when declared in the same file, to be named
 * `<Component>Props`. An imported type, and a type shared by several components,
 * are left alone, since no single component owns them.
 */
class RequirePropsTypeName extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-props-type-name"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a component's local props type to be named after it, e.g. `ButtonProps`.",
            recommended: true,
            category: "react",
        },
        schema: [],
        messages: {
            propsTypeName: nitpick({
                problem: "The props type of `{{component}}` is named `{{actual}}`, not `{{expected}}`.",
                why: "A `<Component>Props` name ties the type to the component it describes, so it can be found from either side, a generic or drifted name breaks that link",
                fix: "Rename `{{actual}}` to `{{expected}}`, along with its references",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        const usages: PropsUsage[] = []

        /**
         * Records the props type a component is declared with.
         * @param fn The function to inspect.
         */
        const collect = (fn: FunctionNode): void => {
            if (!isComponentFunction(fn, context.sourceCode.visitorKeys)) return

            const type = getPropsTypeName(fn)
            if (type === null) return

            usages.push({
                component: getFunctionName(fn) ?? "",
                type,
            })
        }

        return {
            FunctionDeclaration(node) {
                collect(node)
            },
            FunctionExpression(node) {
                collect(node)
            },
            ArrowFunctionExpression(node) {
                collect(node)
            },
            "Program:exit"(program: TSESTree.Program) {
                const locals = new Set<string>()

                for (const statement of program.body) {
                    const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement

                    if (
                        declaration?.type === "TSTypeAliasDeclaration" ||
                        declaration?.type === "TSInterfaceDeclaration"
                    ) {
                        locals.add(declaration.id.name)
                    }
                }

                for (const { component, type } of usages) {
                    const expected = `${component}${CONSTANTS.REACT.PROPS_SUFFIX}`
                    if (type.name === expected || !locals.has(type.name)) continue

                    // A type several components share belongs to none of them
                    if (usages.filter(usage => usage.type.name === type.name).length > 1) continue

                    context.report({
                        node: type,
                        messageId: "propsTypeName",
                        data: {
                            component,
                            actual: type.name,
                            expected,
                        },
                    })
                }
            },
        }
    }
}

export default new RequirePropsTypeName()
