import type { TSESLint, TSESTree } from "@typescript-eslint/utils"

/**
 * Rebuilds an object literal across multiple lines, indenting each property one
 * level past the line the object opens on and closing the brace back at that
 * level, so the result matches the surrounding indentation.
 * @param sourceCode The source code of the linted file.
 * @param node The object expression to expand.
 * @param indent The number of spaces in one indentation level.
 * @returns The multiline object literal source text.
 */
export function expandObjectLiteral(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.ObjectExpression,
    indent: number,
): string {
    const openingLine = sourceCode.lines[node.loc.start.line - 1] ?? ""
    const baseIndent = openingLine.match(/^\s*/)?.[0] ?? ""
    const propertyIndent = baseIndent + " ".repeat(indent)

    const body = node.properties.map(property => `${propertyIndent}${sourceCode.getText(property)}`).join(",\n")

    return `{\n${body},\n${baseIndent}}`
}
