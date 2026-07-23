import CONSTANTS from "@/lib/constants"

/**
 * Checks whether a single comment line is a decorative separator, i.e. a banner,
 * a box-drawing rule, or a label fenced by repeated separator characters.
 * @param line The raw comment line, still carrying any leading ` * ` marker.
 * @returns `true` if the line is decorative.
 */
export function isDecorativeCommentLine(line: string): boolean {
    const content = line.replace(/^\s*\*?\s*/, "").trimEnd()
    if (content.length === 0) return false

    return (
        CONSTANTS.BOX_DRAWING.test(content) ||
        CONSTANTS.PURE_SEPARATOR.test(content) ||
        CONSTANTS.WRAPPED_LABEL.test(content)
    )
}
