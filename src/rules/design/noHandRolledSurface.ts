import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { classFragments, classNameAttribute, joinFragments } from "@/lib/utils/classnames"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "handRolled"

// The primitive that owns the card surface, and the family of parts named after it
const CARD = "Card"

// A heuristic, and meant to stay a warning: a bordered region that is legitimately
// not a card looks the same from here, so the value is prompting the question
/**
 * Flags an element whose classes combine a rounded corner, a border and a card
 * background, in a file that never imports the `Card` primitive. That is a card
 * drawn by hand, and will not follow the radius, border or elevation when those
 * move.
 */
class NoHandRolledSurface extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-hand-rolled-surface"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Disallow drawing a card surface by hand when the `Card` primitive is not used.",
            recommended: true,
            category: "design",
        },
        schema: [],
        messages: {
            handRolled: nitpick({
                problem: "This element draws a card surface by hand (rounded + border + card background).",
                why: "A hand-drawn surface does not track the card radius, border and elevation, so it drifts as soon as those change",
                fix: "Use the `Card` primitive, or drop the background if this is a plain bordered region",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        const candidates: TSESTree.JSXAttribute[] = []
        let usesCard = false

        return {
            ImportDeclaration(node) {
                for (const specifier of node.specifiers) {
                    if (specifier.type !== "ImportSpecifier") continue
                    if (specifier.imported.type !== "Identifier") continue

                    // "Card", and the parts named after it, all come from the primitive
                    if (specifier.imported.name.startsWith(CARD)) usesCard = true
                }
            },

            JSXOpeningElement(node) {
                const attribute = classNameAttribute(node)
                if (attribute === undefined) return

                // A surface can be assembled across the arms of a "cn(...)" call, so the
                // question is what the element carries in total, not per string
                const classes = joinFragments(classFragments(attribute.value, context.sourceCode.visitorKeys))
                if (!CONSTANTS.DESIGN.SURFACE.every(pattern => pattern.test(classes))) return

                candidates.push(attribute)
            },

            "Program:exit"() {
                if (usesCard) return

                for (const attribute of candidates) {
                    context.report({ node: attribute, messageId: "handRolled" })
                }
            },
        }
    }
}

export default new NoHandRolledSurface()
