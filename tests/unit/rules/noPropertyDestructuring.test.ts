import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-property-destructuring"

describe("no-property-destructuring", () => {
    test("It should not report destructuring a call result", ({ expect }) => {
        const messages = lintRule(RULE, "const { current } = useThing()")
        expect(messages).toHaveLength(0)
    })

    test("It should not report destructuring an await result", ({ expect }) => {
        const messages = lintRule(RULE, "const { data } = await load()")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a rename (snake to camel)", ({ expect }) => {
        const messages = lintRule(RULE, "const { dataset_ids: datasetIds } = payload")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a destructure with a default", ({ expect }) => {
        const messages = lintRule(RULE, "const { a = 1 } = obj")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a destructure with a rest element", ({ expect }) => {
        const messages = lintRule(RULE, "const { a, ...rest } = obj")
        expect(messages).toHaveLength(0)
    })

    test("It should not report array destructuring", ({ expect }) => {
        const messages = lintRule(RULE, "const [first] = items")
        expect(messages).toHaveLength(0)
    })

    test("It should not report a `let` binding", ({ expect }) => {
        const messages = lintRule(RULE, "let { a } = obj")
        expect(messages).toHaveLength(0)
    })

    test("It should report a shorthand grab off a plain object", ({ expect }) => {
        const messages = lintRule(RULE, "const { a } = object")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-property-destructuring")
        expect(messages[0]?.messageId).toBe("destructure")
    })

    test("It should report multiple shorthand grabs", ({ expect }) => {
        const messages = lintRule(RULE, "const { a, b } = object")
        expect(messages).toHaveLength(1)
    })

    test("It should report destructuring off a member access", ({ expect }) => {
        const messages = lintRule(RULE, "const { a } = this.state")
        expect(messages).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const { a } = object")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
