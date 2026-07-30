import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"

/**
 * Checks whether a comment is a JSDoc comment, i.e. a block comment that opens
 * with `/**`.
 * @param comment The comment to test.
 * @returns True if the comment is a JSDoc block comment.
 */
export function isJSDocComment(comment: TSESTree.Comment): boolean {
    return comment.type === "Block" && comment.value.startsWith("*")
}

/**
 * Checks whether a node is immediately preceded by a JSDoc comment.
 * @param sourceCode The source code of the linted file.
 * @param node The node to inspect the leading comments of.
 * @returns True if the comment right before the node is a JSDoc comment.
 */
export function hasLeadingJSDoc(sourceCode: Readonly<TSESLint.SourceCode>, node: TSESTree.Node): boolean {
    const commentsBefore = sourceCode.getCommentsBefore(node)
    const closest = commentsBefore.at(-1)

    return closest !== undefined && isJSDocComment(closest)
}

/**
 * Checks whether a physical JSDoc line is blank, i.e. just a ` * ` with no
 * content after it.
 * @param line The physical source line to test.
 * @returns True if the line is an empty JSDoc line.
 */
export function isBlankJSDocLine(line: string): boolean {
    return /^\s*\*\s*$/.test(line)
}

/**
 * Resolves the block-tag name a JSDoc line starts with, e.g. `param` or
 * `returns`, or `null` if the line is not a tag line.
 * @param line The physical source line to inspect.
 * @returns The tag name without its `@`, or `null`.
 */
export function getJSDocLineTag(line: string): string | null {
    const match = line.match(CONSTANTS.JSDOC.TAG)
    return match?.[1] ?? null
}

/**
 * Checks whether a physical JSDoc line holds a block tag, i.e. a ` * ` followed
 * by an `@tag` such as `@param` or `@returns`.
 * @param line The physical source line to test.
 * @returns True if the line starts a JSDoc tag.
 */
export function isJSDocTagLine(line: string): boolean {
    return getJSDocLineTag(line) !== null
}

/**
 * Extracts the description prose of a JSDoc comment, i.e. everything before the
 * first block tag, with the ` * ` markers stripped and wrapped lines joined into
 * a single space-separated string.
 * @param comment The JSDoc comment to read.
 * @returns The description as one collapsed prose string.
 */
export function getJSDocDescription(comment: TSESTree.Comment): string {
    const parts: string[] = []

    for (const line of comment.value.split("\n")) {
        const content = line.replace(/^\s*\*? ?/, "").trimEnd()
        if (content.startsWith("@")) break

        parts.push(content)
    }

    return parts.join(" ").replace(/\s+/g, " ").trim()
}

/**
 * Finds the source-line range of a JSDoc comment's `@returns` (or `@return`)
 * block, spanning the tag line down to the line before the next tag or the
 * closing `*​/`.
 * @param sourceCode The source code of the linted file.
 * @param comment The JSDoc comment to inspect.
 * @returns The inclusive `from`/`to` source lines, or `null` if there is none.
 */
export function findJSDocReturnsRange(
    sourceCode: Readonly<TSESLint.SourceCode>,
    comment: TSESTree.Comment,
): { from: number; to: number } | null {
    let tagLine = -1
    for (let line = comment.loc.start.line + 1; line < comment.loc.end.line; line++) {
        const tag = getJSDocLineTag(sourceCode.lines[line - 1] ?? "")
        if (tag === "returns" || tag === "return") {
            tagLine = line
            break
        }
    }

    if (tagLine === -1) return null

    let to = comment.loc.end.line - 1
    for (let line = tagLine + 1; line < comment.loc.end.line; line++) {
        if (isJSDocTagLine(sourceCode.lines[line - 1] ?? "")) {
            to = line - 1
            break
        }
    }

    return {
        from: tagLine,
        to,
    }
}
