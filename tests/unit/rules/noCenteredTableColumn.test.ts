import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-centered-table-column"
const TSX = { filename: "Table.tsx" }

describe("no-centered-table-column", () => {
    test("It should report a centered header cell", ({ expect }) => {
        const messages = lintRule(RULE, 'const x = <TableHead className="text-center">Qty</TableHead>', TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("centered")
    })

    test("It should report a centered body cell", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <TableCell className="w-24 text-center">3</TableCell>', TSX)).toHaveLength(1)
    })

    test("It should not report a left- or right-aligned cell", ({ expect }) => {
        const code =
            '<div><TableHead className="text-left">A</TableHead><TableCell className="text-right">1</TableCell></div>'
        expect(lintRule(RULE, `const x = ${code}`, TSX)).toHaveLength(0)
    })

    test("It should not report a cell with no className", ({ expect }) => {
        expect(lintRule(RULE, "const x = <TableCell>3</TableCell>", TSX)).toHaveLength(0)
    })

    test("It should not report text-center on a non-table element", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <div className="text-center">Empty</div>', TSX)).toHaveLength(0)
    })

    test("It should find the class inside a cn() call", ({ expect }) => {
        const code = 'const x = <TableCell className={cn("px-2", isNumeric && "text-center")} />'
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should not match a longer class that merely contains the name", ({ expect }) => {
        expect(lintRule(RULE, 'const x = <TableCell className="text-centered-thing" />', TSX)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, 'const x = <TableHead className="text-center" />', TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
