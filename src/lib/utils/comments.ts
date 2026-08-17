import type { TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"

/**
 * The first prose character of a comment, with its absolute source index.
 */
type CommentContent = { index: number; char: string }

/**
 * Checks whether a comment is a tooling directive (eslint, `ts-`, biome-ignore,
 * etc.) rather than prose, which should not be treated as an English sentence.
 * @param comment The comment to test.
 * @returns True if the comment is a directive.
 */
export function isDirectiveComment(comment: TSESTree.Comment): boolean {
    return CONSTANTS.COMMENTS.DIRECTIVE.test(comment.value)
}

/**
 * Finds the first prose character of a comment, skipping the `//` or `/*`
 * delimiters and, for a block comment, the per-line ` * ` markers, so callers
 * can inspect where the comment's text actually begins.
 * @param comment The comment to inspect.
 * @returns The first content character and its source index, or `null` if the
 * comment has no textual content.
 */
export function firstCommentContentChar(comment: TSESTree.Comment): CommentContent | null {
    // Skip past the opening `//` or `/*` delimiter
    const base = comment.range[0] + 2

    if (comment.type === "Line") {
        const match = comment.value.match(/\S/u)
        if (match?.index === undefined) return null

        return { index: base + match.index, char: match[0] }
    }

    let offset = 0
    for (const line of comment.value.split("\n")) {
        // Strip leading whitespace and a single ` * ` marker; whatever remains is
        // the line's content, so a marker-only line is skipped
        const markerLength = (line.match(/^\s*\*?\s*/u)?.[0] ?? "").length
        const char = line.slice(markerLength).charAt(0)

        if (char !== "") {
            return { index: base + offset + markerLength, char }
        }

        offset += line.length + 1
    }

    return null
}
