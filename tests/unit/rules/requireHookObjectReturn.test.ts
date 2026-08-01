import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-hook-object-return"

describe("require-hook-object-return", () => {
    test("It should not report a hook that returns an object", ({ expect }) => {
        const code =
            "function useMenuActions() {\n    const handle = useCallback(() => {}, [])\n    return { handle }\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a context wrapper that forwards useContext", ({ expect }) => {
        const code = "function useTreeViewContext() {\n    return useContext(TreeViewContext)\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a hook that returns a value", ({ expect }) => {
        expect(lintRule(RULE, "function useIsMobile() {\n    return width < 768\n}")).toHaveLength(0)
    })

    test("It should not report a plain function that returns a function", ({ expect }) => {
        expect(lintRule(RULE, "function buildHandler() {\n    return () => {}\n}")).toHaveLength(0)
    })

    test("It should report a hook that returns a local useCallback", ({ expect }) => {
        const code =
            "function useMenuActions() {\n    const handleMenuAction = useCallback(() => {}, [])\n    return handleMenuAction\n}"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-hook-object-return")
        expect(messages[0]?.messageId).toBe("wrapInObject")
    })

    test("It should report a hook that returns a function expression directly", ({ expect }) => {
        expect(lintRule(RULE, "function useThing() {\n    return () => {}\n}")).toHaveLength(1)
    })

    test("It should report an arrow hook that returns a function", ({ expect }) => {
        expect(lintRule(RULE, "const useThing = () => () => {}")).toHaveLength(1)
    })

    test("It should wrap a returned identifier in an object", ({ expect }) => {
        const code =
            "function useMenuActions() {\n    const handleMenuAction = useCallback(() => {}, [])\n    return handleMenuAction\n}"
        const output = fixRule(RULE, code)
        expect(output).toContain("return { handleMenuAction }")
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const code =
            "function useMenuActions() {\n    const handleMenuAction = useCallback(() => {}, [])\n    return handleMenuAction\n}"
        const messages = lintRule(RULE, code)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
