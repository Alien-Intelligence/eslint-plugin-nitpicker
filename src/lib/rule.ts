import { ESLintUtils, type TSESLint } from "@typescript-eslint/utils"
import { createRule, type NitpickerRuleDocs } from "@/lib/utils/createRule"

/**
 * The base class every Nitpicker rule extends.
 *
 * A rule is expressed as a class so that shared behavior, typing, and metadata
 * live in one place, while each concrete rule only has to declare its name,
 * metadata, default options, and visitor logic, and call {@link toRuleModule} to
 * turn an instance into the plain object ESLint expects.
 */
export abstract class NitpickerRule<MessageIds extends string = string, Options extends readonly unknown[] = []> {
    /**
     * The kebab-case name of the rule, without the plugin prefix
     * (e.g. `no-em-dash`).
     */
    abstract readonly name: string

    /**
     * The ESLint metadata describing the rule (type, docs, schema, messages).
     */
    abstract readonly meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, NitpickerRuleDocs, Options>

    /**
     * The options applied when the rule is enabled without an explicit config.
     */
    abstract readonly defaultOptions: Options

    /**
     * The visitor factory ESLint calls for every linted file.
     * @param context The rule context for the current file.
     * @param options The user options merged with {@link defaultOptions}.
     * @returns The AST visitor listeners.
     */
    abstract create(
        context: Readonly<TSESLint.RuleContext<MessageIds, Options>>,
        options: Readonly<Options>,
    ): TSESLint.RuleListener

    /**
     * Builds the ESLint-compatible rule module from this instance.
     * @returns The plain rule module object consumed by ESLint.
     */
    toRuleModule(): TSESLint.RuleModule<MessageIds, Options, NitpickerRuleDocs> {
        return createRule<Options, MessageIds>({
            name: this.name,
            meta: this.meta,
            defaultOptions: this.defaultOptions,
            create: (context, options) => this.create(context, options),
        })
    }
}
