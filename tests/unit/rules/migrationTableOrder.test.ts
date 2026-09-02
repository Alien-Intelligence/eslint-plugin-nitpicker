import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "migration-table-order"

/**
 * Wraps table-builder statements in a `this.schema.createTable` call.
 * @param body The table-builder statements to wrap.
 * @returns The migration source to lint.
 */
function migration(body: string): string {
    return `this.schema.createTable("things", table => {\n${body}\n})`
}

describe("migration-table-order", () => {
    test("It should not report a correctly grouped table", ({ expect }) => {
        const code = migration(
            [
                '        table.increments("id")',
                '        table.string("name").notNullable()',
                '        table.timestamp("created_at", { useTz: true }).notNullable()',
                '        table.timestamp("updated_at", { useTz: true }).notNullable()',
                '        table.index(["name"], "idx_things_name")',
            ].join("\n"),
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should accept a domain timestamp among the columns", ({ expect }) => {
        const code = migration(
            [
                '        table.increments("id")',
                '        table.timestamp("effective_from", { useTz: true }).notNullable()',
                '        table.timestamp("created_at", { useTz: true }).notNullable()',
                '        table.index(["id"], "x")',
                '        table.unique(["id"], { indexName: "u" })',
            ].join("\n"),
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should accept a domain timestamp after the audit timestamps", ({ expect }) => {
        const code = migration(
            [
                '        table.increments("id")',
                '        table.timestamp("created_at", { useTz: true }).notNullable()',
                '        table.timestamp("updated_at", { useTz: true }).notNullable()',
                '        table.timestamp("expires_at", { useTz: true }).nullable()',
                '        table.timestamp("last_used_at", { useTz: true }).nullable()',
                '        table.index(["id"], "x")',
            ].join("\n"),
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should accept a domain timestamp with a `dateTime` builder", ({ expect }) => {
        const code = migration(
            [
                '        table.timestamp("created_at").notNullable()',
                '        table.dateTime("scheduled_for").nullable()',
            ].join("\n"),
        )
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should still report a plain column after a domain timestamp and the audit ones", ({ expect }) => {
        const code = migration(
            [
                '        table.timestamp("created_at").notNullable()',
                '        table.timestamp("expires_at").nullable()',
                '        table.string("late")',
            ].join("\n"),
        )
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report a soft-delete timestamp placed after an index", ({ expect }) => {
        const code = migration(
            ['        table.index(["id"], "x")', '        table.timestamp("deleted_at").nullable()'].join("\n"),
        )
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a non-migration createTable call", ({ expect }) => {
        const code = 'this.builder.createTable("t", table => {\n    table.string("x")\n})'
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report a column after an index", ({ expect }) => {
        const code = migration(
            ['        table.increments("id")', '        table.index(["id"], "x")', '        table.string("name")'].join(
                "\n",
            ),
        )
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/migration-table-order")
        expect(messages[0]?.messageId).toBe("outOfOrder")
    })

    test("It should report a column after the timestamps", ({ expect }) => {
        const code = migration(
            [
                '        table.string("name")',
                '        table.timestamp("created_at").notNullable()',
                '        table.string("late")',
            ].join("\n"),
        )
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should report a timestamp after an index", ({ expect }) => {
        const code = migration(
            ['        table.index(["id"], "x")', '        table.timestamp("created_at").notNullable()'].join("\n"),
        )
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const code = migration(['        table.index(["id"], "x")', '        table.string("name")'].join("\n"))
        const messages = lintRule(RULE, code)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
