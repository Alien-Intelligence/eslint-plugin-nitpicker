import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-migration-jsdoc"
const IMPORT = 'import { BaseSchema } from "@adonisjs/lucid/schema"\n'

describe("require-migration-jsdoc", () => {
    test("It should not report a migration with a leading JSDoc", ({ expect }) => {
        const code = `${IMPORT}\n/**\n * Creates the groups table.\n */\nexport default class extends BaseSchema {}`
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(0)
    })

    test("It should not report a class that does not extend BaseSchema", ({ expect }) => {
        const messages = lintRule(RULE, "export default class extends Controller {}")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a BaseSchema class that is not the default export", ({ expect }) => {
        const messages = lintRule(RULE, "class Helper extends BaseSchema {}")
        expect(messages).toHaveLength(0)
    })

    test("It should report a migration with no JSDoc", ({ expect }) => {
        const messages = lintRule(RULE, `${IMPORT}\nexport default class extends BaseSchema {}`)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-migration-jsdoc")
        expect(messages[0]?.messageId).toBe("missingJSDoc")
    })

    test("It should report a named migration with no JSDoc", ({ expect }) => {
        const messages = lintRule(RULE, `${IMPORT}\nexport default class BaselineMigration extends BaseSchema {}`)
        expect(messages).toHaveLength(1)
    })

    test("It should not treat a leading line comment as documentation", ({ expect }) => {
        const messages = lintRule(RULE, `${IMPORT}\n// creates the table\nexport default class extends BaseSchema {}`)
        expect(messages).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, `${IMPORT}\nexport default class extends BaseSchema {}`)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
