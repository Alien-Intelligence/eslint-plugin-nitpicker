import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "catch-error-name"

describe("catch-error-name", () => {
    test("It should report a catch binding named `err`", ({ expect }) => {
        const messages = lintRule(RULE, "try {\n    run()\n} catch (err) {\n    handle(err)\n}")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/catch-error-name")
        expect(messages[0]?.messageId).toBe("rename")
    })

    test("It should report a catch binding named `e`", ({ expect }) => {
        expect(lintRule(RULE, "try {\n    run()\n} catch (e) {\n    handle(e)\n}")).toHaveLength(1)
    })

    test("It should not report a catch binding named `error`", ({ expect }) => {
        expect(lintRule(RULE, "try {\n    run()\n} catch (error) {\n    handle(error)\n}")).toHaveLength(0)
    })

    test("It should not report an underscore-prefixed unused binding", ({ expect }) => {
        expect(lintRule(RULE, "try {\n    run()\n} catch (_error) {\n    fallback()\n}")).toHaveLength(0)
    })

    test("It should not report a bare catch with no binding", ({ expect }) => {
        expect(lintRule(RULE, "try {\n    run()\n} catch {\n    fallback()\n}")).toHaveLength(0)
    })

    test("It should not report a destructured catch binding", ({ expect }) => {
        expect(lintRule(RULE, "try {\n    run()\n} catch ({ message }) {\n    log(message)\n}")).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "try {\n    run()\n} catch (err) {\n    handle(err)\n}")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
