import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { nitpick } from "@/lib/utils/messages"
import { expandObjectLiteral, inRecordTable } from "@/lib/utils/objects"
import { matchesGlob } from "@/lib/utils/regex"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ maxKeys: number; indent: number; allowIn: string[] }]
type MessageIds = "shouldWrap"

/**
 * Flags an object literal that packs more than `maxKeys` properties onto a
 * single line, and expands it to one property per line, since a wide inline
 * object is harder to scan than a stacked one. A record table and the `allowIn`
 * globs are exempt.
 */
class RequireMultilineObject extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-multiline-object"
    readonly defaultOptions: Options = [
        {
            maxKeys: CONSTANTS.OBJECTS.MAX_INLINE_KEYS,
            indent: CONSTANTS.OBJECTS.INDENT_WIDTH,
            allowIn: [],
        },
    ]

    readonly meta = {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Require an object literal with more than a few properties to span multiple lines.",
            recommended: true,
            category: "base",
        },
        schema: [
            {
                type: "object",
                properties: {
                    maxKeys: { type: "integer", minimum: 1 },
                    indent: { type: "integer", minimum: 1 },
                    allowIn: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            shouldWrap: nitpick({
                problem: "This object literal has {{count}} properties packed onto a single line.",
                why: "An object with more than {{max}} properties is easier to scan, diff, and edit when each property sits on its own line",
                fix: "Break it across multiple lines, one property per line with a trailing comma",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const maxKeys = options[0]?.maxKeys ?? CONSTANTS.OBJECTS.MAX_INLINE_KEYS
        const indent = options[0]?.indent ?? CONSTANTS.OBJECTS.INDENT_WIDTH

        const allowIn = options[0]?.allowIn ?? []
        if (allowIn.length > 0 && matchesGlob(context.filename, allowIn)) {
            return {}
        }

        return {
            ObjectExpression(node) {
                if (node.properties.length <= maxKeys) return
                if (node.loc.start.line !== node.loc.end.line) return

                // A table of records is read down its columns, so stacking every
                // row trades one scannable block for four times the lines and no
                // alignment
                if (inRecordTable(node)) return

                // The fix rebuilds the object from its properties alone, so a
                // comment between them would be dropped, only auto-fix a clean one
                const hasComments = context.sourceCode.getCommentsInside(node).length > 0

                context.report({
                    node,
                    messageId: "shouldWrap",
                    data: { count: node.properties.length, max: maxKeys },
                    fix: hasComments
                        ? null
                        : fixer => fixer.replaceText(node, expandObjectLiteral(context.sourceCode, node, indent)),
                })
            },
        }
    }
}

export default new RequireMultilineObject()
