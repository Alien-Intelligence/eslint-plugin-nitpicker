import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { isPropertyAccessAlias } from "@/lib/utils/aliases"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "destructure"

/**
 * Flags shorthand object destructuring off a plain object reference
 * (`const { a } = object`), which just aliases `object.a`. Destructuring a call
 * or hook result, renames, defaults, and rest elements are left alone.
 */
class NoPropertyDestructuring extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-property-destructuring"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow shorthand destructuring off a plain object reference, access the property directly.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            destructure: nitpick({
                problem: "Destructuring from `{{source}}` here just aliases its properties.",
                why: "Reading `{{source}}.x` at the use site keeps the origin visible, destructuring a plain object hides where a value comes from (destructuring a call or hook result is fine)",
                fix: "Access the properties on `{{source}}` directly instead of destructuring",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            VariableDeclarator(node) {
                if (node.parent.type !== "VariableDeclaration" || node.parent.kind !== "const") return
                if (node.parent.parent.type === "ExportNamedDeclaration") return
                if (node.id.type !== "ObjectPattern" || node.init === null) return

                // Only a plain object reference is an alias, a call, await, or new
                // result is a computed value worth destructuring
                if (node.init.type !== "Identifier" && !isPropertyAccessAlias(node.init)) return

                // Only pure shorthand grabs (`{ a }`) are aliases, renames,
                // defaults, and rest elements are deliberate
                if (!isAllShorthand(node.id)) return

                context.report({
                    node,
                    messageId: "destructure",
                    data: { source: context.sourceCode.getText(node.init) },
                })
            },
        }
    }
}

/**
 * Checks whether an object pattern is nothing but plain shorthand properties,
 * i.e. `{ a, b }` with no rename, default, computed key, or rest element.
 * @param pattern The object pattern to inspect.
 * @returns `true` if every property is a pure shorthand grab.
 */
function isAllShorthand(pattern: TSESTree.ObjectPattern): boolean {
    if (pattern.properties.length === 0) return false

    return pattern.properties.every(
        property =>
            property.type === "Property" &&
            property.shorthand &&
            !property.computed &&
            property.value.type === "Identifier",
    )
}

export default new NoPropertyDestructuring()
