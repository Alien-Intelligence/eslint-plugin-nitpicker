import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { enclosingFunction } from "@/lib/utils/functions"
import { nitpick } from "@/lib/utils/messages"
import { isComponentOrHook, isDerivedValue } from "@/lib/utils/react"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "useMemo"

/**
 * Flags a `const` in a component or hook whose value is derived through a
 * non-hook call (`list.find(...)`, `format(x)`), which recomputes on every
 * render, and asks for it to move into a `useMemo`.
 */
class RequireDerivedUseMemo extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-derived-usememo"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require a derived value in a component or hook to be memoized with useMemo.",
            recommended: true,
            category: "react",
        },
        schema: [],
        messages: {
            useMemo: nitpick({
                problem: "This derived value is computed inline on every render.",
                why: "A value derived through a call is recomputed each render and has nowhere to document itself, a useMemo makes it stable and gives it a JSDoc home",
                fix: "Wrap it in `useMemo(() => ..., [deps])` with a JSDoc describing the value, even for a one-liner",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        return {
            VariableDeclarator(node) {
                if (node.parent.type !== "VariableDeclaration" || node.parent.kind !== "const") return
                if (node.id.type !== "Identifier" || node.init === null) return

                // Only a direct local of a component or hook can move into a useMemo
                const fn = enclosingFunction(node)
                if (fn === null || !isComponentOrHook(fn, context.sourceCode.visitorKeys)) return

                if (!isDerivedValue(node.init, context.sourceCode.visitorKeys)) return

                context.report({ node, messageId: "useMemo" })
            },
        }
    }
}

export default new RequireDerivedUseMemo()
