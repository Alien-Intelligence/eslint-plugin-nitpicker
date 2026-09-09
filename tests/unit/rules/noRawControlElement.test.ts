import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-raw-control-element"
const TSX = { filename: "Component.tsx" }

describe("no-raw-control-element", () => {
    test("It should report a bare button", ({ expect }) => {
        const messages = lintRule(RULE, "const x = <button onClick={go}>Go</button>", TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("rawControl")
    })

    test("It should name the primitive that replaces the tag", ({ expect }) => {
        const messages = lintRule(RULE, "const x = <textarea />", TSX)
        expect(messages[0]?.message).toContain("`Textarea`")
    })

    test("It should report each of the bare controls", ({ expect }) => {
        const code = "const x = <div><input /><select /><textarea /></div>"
        expect(lintRule(RULE, code, TSX)).toHaveLength(3)
    })

    test("It should not report the capitalized primitives", ({ expect }) => {
        const code = "const x = <div><Button /><Input /><Select /><Textarea /></div>"
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should not report an unrelated host element", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div><span /><a href="/" /></div>', TSX)).toHaveLength(0)
    })

    test("It should respect a narrowed elements option", ({ expect }) => {
        const opts = { options: [{ elements: ["button"] }], filename: "Component.tsx" }
        expect(lintRule(RULE, "const x = <div><button /><input /></div>", opts)).toHaveLength(1)
    })

    test("It should respect allowIn", ({ expect }) => {
        const opts = { options: [{ allowIn: ["**/wizards/**"] }], filename: "components/wizards/import.tsx" }
        expect(lintRule(RULE, 'const x = <input type="file" className="hidden" />', opts)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, "const x = <button />", TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
