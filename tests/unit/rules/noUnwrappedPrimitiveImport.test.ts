import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-unwrapped-primitive-import"

const WRAPPED = {
    wrapped: {
        sonner: { Toaster: "@frontend/components/ui/sonner" },
        "@radix-ui/react-dialog": {
            DialogClose: "@frontend/components/ui/dialog",
            DialogTitle: "@frontend/components/ui/dialog",
        },
    },
}

const TSX = { options: [WRAPPED], filename: "Component.tsx" }

describe("no-unwrapped-primitive-import", () => {
    test("It should report a wrapped symbol imported from the library", ({ expect }) => {
        const messages = lintRule(RULE, 'import { Toaster } from "sonner"', TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.messageId).toBe("unwrapped")
        expect(messages[0]?.message).toContain("@frontend/components/ui/sonner")
    })

    test("It should not report an unwrapped symbol from the same package", ({ expect }) => {
        expect(lintRule(RULE, 'import { toast } from "sonner"', TSX)).toHaveLength(0)
    })

    test("It should not report the wrapper import itself", ({ expect }) => {
        expect(lintRule(RULE, 'import { Toaster } from "@frontend/components/ui/sonner"', TSX)).toHaveLength(0)
    })

    test("It should report each wrapped symbol in a mixed import", ({ expect }) => {
        const code = 'import { DialogClose, DialogTitle, Portal } from "@radix-ui/react-dialog"'
        expect(lintRule(RULE, code, TSX)).toHaveLength(2)
    })

    test("It should key on the imported name, not the local alias", ({ expect }) => {
        const code = 'import { DialogTitle as Title } from "@radix-ui/react-dialog"'
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should not report a default or namespace import", ({ expect }) => {
        expect(lintRule(RULE, 'import * as Dialog from "@radix-ui/react-dialog"', TSX)).toHaveLength(0)
    })

    test("It should not report an unconfigured package", ({ expect }) => {
        expect(lintRule(RULE, 'import { Toaster } from "other-toasts"', TSX)).toHaveLength(0)
    })

    test("It should do nothing with no map configured", ({ expect }) => {
        expect(lintRule(RULE, 'import { Toaster } from "sonner"', { filename: "Component.tsx" })).toHaveLength(0)
    })

    test("It should respect allowIn", ({ expect }) => {
        const opts = {
            options: [{ ...WRAPPED, allowIn: ["**/components/ui/**"] }],
            filename: "components/ui/sonner.tsx",
        }
        expect(lintRule(RULE, 'import { Toaster } from "sonner"', opts)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, 'import { Toaster } from "sonner"', TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
