import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-memo-callback-jsdoc"

describe("require-memo-callback-jsdoc", () => {
    test("It should report a useMemo with no JSDoc", ({ expect }) => {
        const messages = lintRule(RULE, "const x = useMemo(() => compute(), [])")
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-memo-callback-jsdoc")
        expect(messages[0]?.messageId).toBe("missingJSDoc")
    })

    test("It should not report a documented useMemo", ({ expect }) => {
        const code = "/**\n * The total.\n */\nconst x = useMemo(() => compute(), [])"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should report a useCallback with no JSDoc", ({ expect }) => {
        expect(lintRule(RULE, "const f = useCallback(() => run(), [])")).toHaveLength(1)
    })

    test("It should report a documented useCallback missing an @param", ({ expect }) => {
        const code = "/**\n * Picks a row.\n */\nconst onPick = useCallback((id) => use(id), [])"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingParam")
    })

    test("It should not report a useCallback documenting every parameter", ({ expect }) => {
        const code =
            "/**\n * Picks a row.\n * @param id The row id.\n */\nconst onPick = useCallback((id) => use(id), [])"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not require @param on a zero-arg useCallback", ({ expect }) => {
        const code = "/**\n * Runs it.\n */\nconst f = useCallback(() => run(), [])"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should flag a useCallback documenting only some of several parameters", ({ expect }) => {
        const code =
            "/**\n * Picks.\n * @param id The id.\n */\nconst onPick = useCallback((id, opts) => use(id, opts), [])"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingParam")
    })

    test("It should check a useCallback documented above its `export` keyword", ({ expect }) => {
        const code = "/**\n * Picks.\n */\nexport const onPick = useCallback((id) => use(id), [])"
        const messages = lintRule(RULE, code)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingParam")
    })

    test("It should not count an underscore-prefixed callback parameter", ({ expect }) => {
        const code = [
            "/**",
            " * Handles the broadcast.",
            " * @param state The state.",
            " */",
            "const onEvent = useCallback((_, state) => apply(state), [])",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a non-memo hook call", ({ expect }) => {
        expect(lintRule(RULE, "const [x, setX] = useState(0)")).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const x = useMemo(() => compute(), [])")
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
