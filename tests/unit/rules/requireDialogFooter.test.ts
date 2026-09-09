import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-dialog-footer"
const TSX = { filename: "Dialog.tsx" }

describe("require-dialog-footer", () => {
    test("It should report a dialog with a button but no footer", ({ expect }) => {
        const code = `
            const x = (
                <DialogContent>
                    <p>Sure?</p>
                    <Button>Confirm</Button>
                </DialogContent>
            )
        `
        const messages = lintRule(RULE, code, TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("missingFooter")
    })

    test("It should not report a dialog whose actions are in the footer", ({ expect }) => {
        const code = `
            const x = (
                <DialogContent>
                    <DialogFooter>
                        <Button>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            )
        `
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should not report a dialog with no actions at all", ({ expect }) => {
        const code = "const x = <DialogContent><p>Just some text</p></DialogContent>"
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should find a button nested deep inside the dialog", ({ expect }) => {
        const code = `
            const x = (
                <DialogContent>
                    <div><div><Button>Confirm</Button></div></div>
                </DialogContent>
            )
        `
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should not let a sibling dialog lend this one a footer", ({ expect }) => {
        const code = `
            const x = (
                <>
                    <DialogContent><Button>A</Button></DialogContent>
                    <DialogContent><DialogFooter><Button>B</Button></DialogFooter></DialogContent>
                </>
            )
        `
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should not report a button outside any dialog", ({ expect }) => {
        expect(lintRule(RULE, "const x = <div><Button>Go</Button></div>", TSX)).toHaveLength(0)
    })

    test("It should respect allowIn", ({ expect }) => {
        const opts = { options: [{ allowIn: ["**/admin/**"] }], filename: "dialogs/admin/billing.tsx" }
        const code = "const x = <DialogContent><Button>Confirm</Button></DialogContent>"
        expect(lintRule(RULE, code, opts)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const code = "const x = <DialogContent><Button>Confirm</Button></DialogContent>"
        const messages = lintRule(RULE, code, TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
