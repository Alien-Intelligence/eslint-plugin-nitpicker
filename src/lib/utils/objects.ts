import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"

/**
 * Reads the column signature of an object literal, i.e. its property names in
 * source order, so two literals can be compared as rows of the same table. A
 * spread or a computed key has no static name, which makes the shape unknowable.
 * @param node The object expression to read.
 * @returns The signature, or `null` when the object has no static shape.
 */
function columnSignature(node: TSESTree.ObjectExpression): string | null {
    const keys: string[] = []

    for (const property of node.properties) {
        if (property.type !== "Property" || property.computed) return null

        if (property.key.type === "Identifier") keys.push(property.key.name)
        else if (property.key.type === "Literal") keys.push(String(property.key.value))
        else return null
    }

    return keys.join(",")
}

/**
 * Checks whether an object literal is one row of a record table, i.e. an element
 * of an array whose entries are all single-line object literals carrying the same
 * keys in the same order, one row per line.
 * @param node The object expression to test.
 * @returns True if the object is a row of a record table.
 */
function isRecordTableRow(node: TSESTree.ObjectExpression): boolean {
    if (node.parent.type !== "ArrayExpression") return false
    if (node.parent.elements.length < CONSTANTS.OBJECTS.MIN_TABLE_ROWS) return false

    const signature = columnSignature(node)
    if (signature === null) return false

    const lines = new Set<number>()

    for (const element of node.parent.elements) {
        if (element === null || element.type !== "ObjectExpression") return false

        // A row spanning lines, or sharing one with the row above it, gives the
        // reader no column to scan down, so the array is a list rather than a table
        if (element.loc.start.line !== element.loc.end.line) return false
        if (lines.has(element.loc.start.line)) return false
        if (columnSignature(element) !== signature) return false

        lines.add(element.loc.start.line)
    }

    return true
}

/**
 * Checks whether an object literal belongs to a record table, either as a row of
 * one or as something nested inside a row, since expanding either breaks the
 * aligned columns that are the table's whole value.
 * @param node The object expression to test.
 * @returns True if the object sits inside a record table.
 */
export function inRecordTable(node: TSESTree.ObjectExpression): boolean {
    let current: TSESTree.Node | undefined = node

    // Walk out through the literal structure alone, so the search stops at the
    // statement the outermost literal belongs to rather than climbing the file
    while (current !== undefined && CONSTANTS.OBJECTS.LITERAL_NODES.has(current.type)) {
        if (current.type === "ObjectExpression" && isRecordTableRow(current)) return true

        current = current.parent
    }

    return false
}

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
