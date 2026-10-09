import { ASTUtils, type TSESLint, type TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { type FunctionNode, getDocumentableNode, getFunctionName, isTopLevel } from "@/lib/utils/functions"
import { nitpick } from "@/lib/utils/messages"
import { getPropsType, isComponentFunction } from "@/lib/utils/react"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = []
type MessageIds = "inlineProps"

/**
 * Flags a component whose props are typed with an inline object literal, and
 * extracts it into a `<Component>Props` type above the component. An
 * intersection extending a library type (`ComponentProps<"button"> & { … }`) is
 * left alone.
 */
class NoInlinePropsType extends NitpickerRule<MessageIds, Options> {
    readonly name = "no-inline-props-type"

    readonly defaultOptions: Options = []

    readonly meta = {
        type: "suggestion",
        fixable: "code",
        docs: {
            description: "Disallow an inline object literal as a component's props type; extract a named type.",
            recommended: true,
            category: "react",
        },
        schema: [],
        messages: {
            inlineProps: nitpick({
                problem: "The props of `{{component}}` are typed with an inline object literal.",
                why: "A named props type can be documented, exported and reused, and keeps the signature short, an inline literal can be none of these",
                fix: "Extract it into `type {{expected}} = { ... }` above the component and annotate the props with `{{expected}}`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>): TSESLint.RuleListener {
        /**
         * Finds where an extracted type goes: above the component's statement and
         * the comments attached to it, so its JSDoc stays on the component.
         * @param statement The top-level statement holding the component.
         * @returns The source index to insert the type at.
         */
        const insertionIndex = (statement: TSESTree.Node): number => {
            let start = statement.range[0]
            let line = statement.loc.start.line

            for (const comment of [...context.sourceCode.getCommentsBefore(statement)].reverse()) {
                if (comment.loc.end.line < line - 1) break

                start = comment.range[0]
                line = comment.loc.start.line
            }

            return start
        }

        /**
         * Reports a component whose props are an inline literal, fixing it when
         * the literal can move to the top level as is.
         * @param fn The function to inspect.
         */
        const check = (fn: FunctionNode): void => {
            if (!isComponentFunction(fn, context.sourceCode.visitorKeys)) return

            const literal = getPropsType(fn)
            if (literal?.type !== "TSTypeLiteral") return

            const component = getFunctionName(fn) ?? ""
            const expected = `${component}${CONSTANTS.REACT.PROPS_SUFFIX}`
            const statement = getDocumentableNode(fn)

            // A generic literal may name the component's type parameters, a nested
            // component has no top-level spot, and a taken name would collide
            const isMovable =
                fn.typeParameters === undefined &&
                isTopLevel(statement) &&
                ASTUtils.findVariable(context.sourceCode.getScope(fn), expected) === null

            context.report({
                node: literal,
                messageId: "inlineProps",
                data: {
                    component,
                    expected,
                },
                fix: isMovable
                    ? fixer => [
                          fixer.insertTextBeforeRange(
                              [insertionIndex(statement), insertionIndex(statement)],
                              `type ${expected} = ${context.sourceCode.getText(literal)}\n\n`,
                          ),
                          fixer.replaceText(literal, expected),
                      ]
                    : null,
            })
        }

        return {
            FunctionDeclaration(node) {
                check(node)
            },
            FunctionExpression(node) {
                check(node)
            },
            ArrowFunctionExpression(node) {
                check(node)
            },
        }
    }
}

export default new NoInlinePropsType()
