import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-context-hook-destructure"

describe("require-context-hook-destructure", () => {
    test("It should not report a destructured context hook", ({ expect }) => {
        expect(lintRule(RULE, "const { isRegex, setIsRegex } = useTreeViewContext()")).toHaveLength(0)
    })

    test("It should not report the bare `useContext` call", ({ expect }) => {
        expect(lintRule(RULE, "const theme = useContext(ThemeContext)")).toHaveLength(0)
    })

    test("It should not report a non-context hook bound whole", ({ expect }) => {
        expect(lintRule(RULE, "const menu = useMenuActions()")).toHaveLength(0)
    })

    test("It should report a context hook bound whole", ({ expect }) => {
        const messages = lintRule(RULE, "const treeView = useTreeViewContext()")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-context-hook-destructure")
        expect(messages[0]?.messageId).toBe("destructure")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const treeView = useTreeViewContext()")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
