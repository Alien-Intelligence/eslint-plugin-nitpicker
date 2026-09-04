import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import { NitpickerRule } from "@/lib/rule"
import { getLeadingJSDoc } from "@/lib/utils/jsdocs"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "inconsistent"

/**
 * Flags an interface or type literal that documents some of its members but not
 * all, since a lone JSDoc among bare properties reads as an oversight. Documenting
 * none of them stays fine.
 */
class RequireConsistentMemberJSDoc extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-consistent-member-jsdoc"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Require every member of an interface to be documented once any member is.",
            recommended: true,
            category: "base",
        },
        schema: [],
        messages: {
            inconsistent: nitpick({
                problem: "This member has no JSDoc, but other members of the same block do.",
                why: "A lone JSDoc among bare members reads as an oversight, documentation should be all or nothing per block",
                fix: "Document this member too, or drop the JSDoc from the members that carry one",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        /**
         * Reports the bare members of a block that already documents some others.
         * @param members The members of one interface or type literal.
         */
        const check = (members: TSESTree.TypeElement[]): void => {
            if (members.length < 2) return

            const bare = members.filter(member => getLeadingJSDoc(context.sourceCode, member) === null)

            // All documented, or none, is the consistent state this rule wants
            if (bare.length === 0 || bare.length === members.length) return

            for (const member of bare) {
                context.report({ node: member, messageId: "inconsistent" })
            }
        }

        return {
            TSInterfaceBody(node) {
                check(node.body)
            },
            TSTypeLiteral(node) {
                check(node.members)
            },
        }
    }
}

export default new RequireConsistentMemberJSDoc()
