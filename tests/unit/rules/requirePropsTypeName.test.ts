import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "require-props-type-name"
const TSX = { filename: "Component.tsx" }

describe("require-props-type-name", () => {
    test("It should not report a props type named after its component", ({ expect }) => {
        const code =
            "type CardProps = { title: string }\n\nfunction Card({ title }: CardProps) {\n    return <div>{title}</div>\n}"
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should report a generic Props name", ({ expect }) => {
        const code =
            "type Props = { title: string }\n\nfunction Card({ title }: Props) {\n    return <div>{title}</div>\n}"
        const messages = lintRule(RULE, code, TSX)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/require-props-type-name")
        expect(messages[0]?.messageId).toBe("propsTypeName")
        expect(messages[0]?.message).toContain("`Props`, not `CardProps`")
        expect(messages[0]?.line).toBe(3)
    })

    test("It should report a name that drifted from the component", ({ expect }) => {
        const code =
            "interface ProvisioningStatusProps {\n    id: string\n}\n\nexport default function ClusterProvisioningStatus(props: ProvisioningStatusProps) {\n    return <div />\n}"
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should check an exported type and an arrow component", ({ expect }) => {
        const code = "export type Props = { id: string }\n\nexport const Row = ({ id }: Props) => <tr />"
        expect(lintRule(RULE, code, TSX)).toHaveLength(1)
    })

    test("It should look through Readonly and PropsWithChildren", ({ expect }) => {
        const wrapped = "type Props = { id: string }\n\nconst Row = (props: Readonly<Props>) => <tr />"
        expect(lintRule(RULE, wrapped, TSX)).toHaveLength(1)

        const qualified =
            "type RowProps = { id: string }\n\nconst Row = (props: React.PropsWithChildren<RowProps>) => <tr />"
        expect(lintRule(RULE, qualified, TSX)).toHaveLength(0)
    })

    test("It should not report an imported props type", ({ expect }) => {
        const code = 'import type { Props } from "./types"\n\nconst Row = (props: Props) => <tr />'
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should not report a library type", ({ expect }) => {
        expect(lintRule(RULE, 'const Row = (props: React.ComponentProps<"tr">) => <tr />', TSX)).toHaveLength(0)
        expect(
            lintRule(
                RULE,
                'type BaseProps = { id: string }\n\nconst Row = (props: Omit<BaseProps, "id">) => <tr />',
                TSX,
            ),
        ).toHaveLength(0)
    })

    test("It should not report a type shared by several components", ({ expect }) => {
        const code =
            "type IconProps = { size: number }\n\nconst CheckIcon = (props: IconProps) => <svg />\nconst CrossIcon = (props: IconProps) => <svg />"
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should not report a function that is not a component", ({ expect }) => {
        const code = "type Options = { id: string }\n\nfunction Format(options: Options) {\n    return options.id\n}"
        expect(lintRule(RULE, code, TSX)).toHaveLength(0)
    })

    test("It should not report an inline or intersected props type", ({ expect }) => {
        expect(lintRule(RULE, "const Row = (props: { id: string }) => <tr />", TSX)).toHaveLength(0)

        const intersection = "type Props = { id: string }\n\nconst Row = (props: Props & { extra: string }) => <tr />"
        expect(lintRule(RULE, intersection, TSX)).toHaveLength(0)
    })

    test("It should include AI-friendly why/fix context", ({ expect }) => {
        const messages = lintRule(RULE, "type Props = { id: string }\n\nconst Row = (props: Props) => <tr />", TSX)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
