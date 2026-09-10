import type { TSESLint } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { enclosingFunction } from "@/lib/utils/functions"
import { nitpick } from "@/lib/utils/messages"
import { isComponentOrHook, isDerivedValue, isServerComponentFile } from "@/lib/utils/react"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "useMemo"

/**
 * Flags a `const` in a component or hook whose value is derived through a
 * non-hook call (`list.find(...)`), which recomputes on every render, and asks
 * for it to move into a `useMemo`. A Server Component is exempt, as no hook can
 * run in one.
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
        // A Server Component renders once on the server, where no hook exists
        if (isServerComponentFile(context.sourceCode, context.filename)) return {}

        return {
            VariableDeclarator(node) {
                if (node.parent.type !== "VariableDeclaration" || node.parent.kind !== "const") return
                if (node.id.type !== "Identifier" || node.init === null) return

                // Only a direct local of a component or hook can move into a useMemo
                const fn = enclosingFunction(node)
                if (fn === null || !isComponentOrHook(fn, context.sourceCode.visitorKeys)) return

                // React supports no async component, so this one runs on the
                // server and has no hook available to it either
                if (fn.async) return

                if (!isDerivedValue(node.init, context.sourceCode.visitorKeys)) return

                context.report({ node, messageId: "useMemo" })
            },
        }
    }
}

export default new RequireDerivedUseMemo()
