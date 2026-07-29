import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { NitpickerRule } from "@/lib/rule"
import { detectFrameworks, FRAMEWORK_LABELS, type Framework } from "@/lib/utils/frameworks"
import { nitpick } from "@/lib/utils/messages"
import type { NitpickerRuleDocs } from "@/lib/utils/rules"

type Options = [{ ignore: Framework[] }]
type MessageIds = "missingConfig"

/**
 * Warns when a file uses a framework (AdonisJS, React) whose Nitpicker config is
 * not enabled. Enabling the matching config (which sets a settings flag) or
 * turning off this rule silences it.
 */
class RequireFrameworkConfig extends NitpickerRule<MessageIds, Options> {
    readonly name = "require-framework-config"

    readonly defaultOptions: Options = [{ ignore: [] }]

    readonly meta = {
        type: "suggestion",
        docs: {
            description: "Warn when a file uses a framework whose Nitpicker config is not enabled.",
            recommended: true,
            category: "base",
        },
        schema: [
            {
                type: "object",
                properties: {
                    ignore: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["adonisjs", "react"],
                        },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            missingConfig: nitpick({
                problem: "This file uses {{framework}} but the Nitpicker {{framework}} rules are not enabled.",
                why: "Framework rules only run when you opt into the matching config, so files like this one go unchecked",
                fix: "Add `nitpicker.configs.{{config}}` (scoped to these files) to your ESLint config, or turn off `nitpicker/require-framework-config`",
            }),
        },
    } satisfies TSESLint.RuleMetaData<MessageIds, NitpickerRuleDocs, Options>

    create(context: Readonly<TSESLint.RuleContext<MessageIds, Options>>, options: Options): TSESLint.RuleListener {
        const ignored = new Set(options[0]?.ignore ?? [])

        // Each framework config stamps `settings.nitpicker<framework> = true`
        const enabled = (context.settings[CONSTANTS.PLUGIN_NAME] ?? {}) as Partial<Record<Framework, boolean>>

        return {
            Program(node) {
                const detected = detectFrameworks(context.sourceCode, context.filename)

                for (const framework of detected) {
                    if (ignored.has(framework) || enabled[framework]) continue

                    context.report({
                        node,
                        messageId: "missingConfig",
                        data: { framework: FRAMEWORK_LABELS[framework], config: framework },
                    })
                }
            },
        }
    }
}

export default new RequireFrameworkConfig()
