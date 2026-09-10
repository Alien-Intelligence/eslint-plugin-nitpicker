import type { TSESLint } from "@typescript-eslint/utils"
import { lintRule } from "tests/utils/lint"
import { describe, expect, test } from "vitest"
import { isServerComponentFile } from "@/lib/utils/react"

const RULE = "require-derived-usememo"
const TSX = { filename: "Component.tsx" }

describe("require-derived-usememo", () => {
    test("It should report a derived const in a hook", ({ expect }) => {
        const code = "function useThing() {\n    const c = list.find(x => x.id === id) || null\n    return c\n}"
        const messages = lintRule(RULE, code)

        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-derived-usememo")
        expect(messages[0]?.messageId).toBe("useMemo")
    })

    test("It should report a derived const in a component", ({ expect }) => {
        const code = "function Foo() {\n    const rows = data.filter(r => r.ok)\n    return <div>{rows}</div>\n}"
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should not report a bare hook result", ({ expect }) => {
        const code = "function useThing() {\n    const x = useMemo(() => compute(), [])\n    return x\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report plain property access", ({ expect }) => {
        expect(lintRule(RULE, "function useThing() {\n    const n = props.name\n    return n\n}")).toHaveLength(0)
    })

    test("It should not report a callback value (that is useCallback territory)", ({ expect }) => {
        expect(lintRule(RULE, "function useThing() {\n    const cb = () => doThing()\n    return cb\n}")).toHaveLength(
            0,
        )
    })

    test("It should not report a derived const outside a component or hook", ({ expect }) => {
        expect(lintRule(RULE, "function helper() {\n    const c = list.find(x => x.ok)\n    return c\n}")).toHaveLength(
            0,
        )
    })

    test("It should not descend into a callback's own calls", ({ expect }) => {
        // The map is the derivation; the arrow inside is not counted separately
        const code = "function useThing() {\n    const items = raw.map(r => transform(r))\n    return items\n}"
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a value with no call (arithmetic or logic)", ({ expect }) => {
        expect(lintRule(RULE, "function useThing() {\n    const n = a + b * 2\n    return n\n}")).toHaveLength(0)
    })

    test("It should not crash on a module-scope const whose init is a call", ({ expect }) => {
        // The ancestor walk must stop at Program (whose parent is null), not read past it
        expect(lintRule(RULE, "const Ctx = createContext()")).toHaveLength(0)
        expect(lintRule(RULE, "const logger = createLogger({ level: 1 })")).toHaveLength(0)
    })

    test("It should not report a destructured hook result", ({ expect }) => {
        const code = "function useThing() {\n    const [x, setX] = useState(0)\n    return x\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report a const inside a nested callback", ({ expect }) => {
        const code = "function useThing() {\n    useEffect(() => {\n        const c = list.find(x => x.ok)\n    })\n}"
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should not report an async component, which no hook can run in", ({ expect }) => {
        const code = "async function Page() {\n    const rows = data.filter(r => r.ok)\n    return <div>{rows}</div>\n}"
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should not report an async arrow component", ({ expect }) => {
        const code =
            "const Page = async () => {\n    const rows = data.filter(r => r.ok)\n    return <div>{rows}</div>\n}"
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should still report the sync component beside an async one", ({ expect }) => {
        const code = [
            "async function Page() {",
            "    const rows = data.filter(r => r.ok)",
            "    return <div>{rows}</div>",
            "}",
            "function Panel() {",
            "    const cols = data.map(r => r.id)",
            "    return <div>{cols}</div>",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test.each([
        "app/page.tsx",
        "app/layout.tsx",
        "app/dashboard/page.tsx",
        "packages/frontend/app/admin/settings/layout.tsx",
        "app/template.tsx",
        "app/default.tsx",
        "app/loading.tsx",
        "app/not-found.tsx",
    ])("It should not report a server component in %s", filename => {
        const code = "function Page() {\n    const rows = data.filter(r => r.ok)\n    return <div>{rows}</div>\n}"
        expect(lintRule(RULE, code, { filename })).toHaveLength(0)
    })

    test("It should detect a server component on a Windows path", ({ expect }) => {
        // ESLint hands the rule an OS-native path, so a backslash one must resolve too
        const empty = { ast: { body: [] } } as unknown as Readonly<TSESLint.SourceCode>
        expect(isServerComponentFile(empty, "F:\\repo\\app\\dash\\page.tsx")).toBe(true)
        expect(isServerComponentFile(empty, "F:\\repo\\app\\dash\\Chart.tsx")).toBe(false)
    })

    test("It should report an App Router file that opts into the client", ({ expect }) => {
        const code = [
            '"use client"',
            "",
            "function Page() {",
            "    const rows = data.filter(r => r.ok)",
            "    return <div>{rows}</div>",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code, { filename: "app/dashboard/page.tsx" })).toHaveLength(1)
    })

    test("It should ignore a 'use client' that is not in the prologue", ({ expect }) => {
        // Next.js only honors the directive at the top, so the file stays a
        // server component and the rule stays quiet rather than guessing
        const code = [
            "import { data } from './data'",
            '"use client"',
            "",
            "function Page() {",
            "    const rows = data.filter(r => r.ok)",
            "    return <div>{rows}</div>",
            "}",
        ].join("\n")
        expect(lintRule(RULE, code, { filename: "app/dashboard/page.tsx" })).toHaveLength(0)
    })

    test.each([
        "app/dashboard/Chart.tsx",
        "pages/index.tsx",
        "src/components/page.tsx",
        "app/dashboard/layout.test.tsx",
    ])("It should still report a non-server-entry file at %s", filename => {
        const code = "function Page() {\n    const rows = data.filter(r => r.ok)\n    return <div>{rows}</div>\n}"
        expect(lintRule(RULE, code, { filename })).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const code = "function useThing() {\n    const c = list.find(x => x.id)\n    return c\n}"
        const messages = lintRule(RULE, code)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
