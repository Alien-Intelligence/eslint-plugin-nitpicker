import { fixRule, lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "no-inline-props-type"
const TSX = { filename: "Component.tsx" }

describe("no-inline-props-type", () => {
    test("It should not report a component typed with a named type", ({ expect }) => {
        const code =
            "type CardProps = { title: string }\n\nfunction Card({ title }: CardProps) {\n    return <div>{title}</div>\n}"
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should report an inline literal on a destructured component", ({ expect }) => {
        const code = "function Card({ title }: { title: string }) {\n    return <div>{title}</div>\n}"
        const messages = lintRule(RULE, code, TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/no-inline-props-type")
        expect(messages[0]?.messageId).toBe("inlineProps")
        expect(messages[0]?.message).toContain("`CardProps`")
    })

    test("It should extract the literal into a named type above the component", ({ expect }) => {
        const code = "function Card({ title }: { title: string }) {\n    return <div>{title}</div>\n}"
        expect(fixRule(RULE, code, TSX)).toBe(
            "type CardProps = { title: string }\n\nfunction Card({ title }: CardProps) {\n    return <div>{title}</div>\n}",
        )
    })

    test("It should keep a multi-line literal's layout", ({ expect }) => {
        const code = [
            "export default function AdminLayout({",
            "    children,",
            "}: {",
            "    children: React.ReactNode",
            "}) {",
            "    return <main>{children}</main>",
            "}",
        ].join("\n")
        const fixed = [
            "type AdminLayoutProps = {",
            "    children: React.ReactNode",
            "}",
            "",
            "export default function AdminLayout({",
            "    children,",
            "}: AdminLayoutProps) {",
            "    return <main>{children}</main>",
            "}",
        ].join("\n")
        expect(fixRule(RULE, code, TSX)).toBe(fixed)
    })

    test("It should place the type above the component's JSDoc", ({ expect }) => {
        const code =
            'import x from "x"\n\n/**\n * The card.\n */\nexport const Card = (props: { title: string }) => <div />'
        expect(fixRule(RULE, code, TSX)).toBe(
            'import x from "x"\n\ntype CardProps = { title: string }\n\n/**\n * The card.\n */\nexport const Card = (props: CardProps) => <div />',
        )
    })

    test("It should not move a comment separated by a blank line", ({ expect }) => {
        const code = "// Header\n\nconst Card = (props: { title: string }) => <div />"
        expect(fixRule(RULE, code, TSX)).toBe(
            "// Header\n\ntype CardProps = { title: string }\n\nconst Card = (props: CardProps) => <div />",
        )
    })

    test("It should report without fixing a generic component", ({ expect }) => {
        const code = "function List<T>({ items }: { items: T[] }) {\n    return <ul />\n}"
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
        expect(fixRule(RULE, code, TSX)).toBe(code)
    })

    test("It should report without fixing a nested component", ({ expect }) => {
        const code = "function make() {\n    const Row = ({ id }: { id: string }) => <tr />\n    return Row\n}"
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
        expect(fixRule(RULE, code, TSX)).toBe(code)
    })

    test("It should report without fixing when the name is taken", ({ expect }) => {
        const code = 'import { CardProps } from "./types"\n\nconst Card = (props: { title: string }) => <div />'
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
        expect(fixRule(RULE, code, TSX)).toBe(code)
    })

    test("It should not report an intersection extending a library type", ({ expect }) => {
        const code =
            'function Button({ asChild, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {\n    return <button {...props} />\n}'
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should not report a function that is not a component", ({ expect }) => {
        expect(lintRule(RULE, "function format({ id }: { id: string }) {\n    return id\n}", TSX)).toHaveLength(0)
        expect(lintRule(RULE, "function Format({ id }: { id: string }) {\n    return id\n}", TSX)).toHaveLength(0)
    })

    test("It should not report an unannotated or parameterless component", ({ expect }) => {
        expect(lintRule(RULE, "function Card(props) {\n    return <div />\n}", TSX)).toHaveLength(0)
        expect(lintRule(RULE, "function Card() {\n    return <div />\n}", TSX)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context", ({ expect }) => {
        const messages = lintRule(RULE, "const Card = (props: { title: string }) => <div />", TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
