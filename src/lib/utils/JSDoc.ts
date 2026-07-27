import type { TSESLint, TSESTree } from "@typescript-eslint/utils"

/**
 * Checks whether a comment is a JSDoc comment, i.e. a block comment that opens
 * with `/**`.
 * @param comment The comment to test.
 * @returns `true` if the comment is a JSDoc block comment.
 */
export function isJSDocComment(comment: TSESTree.Comment): boolean {
    return comment.type === "Block" && comment.value.startsWith("*")
}

/**
 * Checks whether a node is immediately preceded by a JSDoc comment.
 * @param sourceCode The source code of the linted file.
 * @param node The node to inspect the leading comments of.
 * @returns `true` if the comment right before the node is a JSDoc comment.
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
 * @returns `true` if the line is an empty JSDoc line.
 */
export function isBlankJSDocLine(line: string): boolean {
    return /^\s*\*\s*$/.test(line)
}

/**
 * Checks whether a physical JSDoc line holds a block tag, i.e. a ` * ` followed
 * by an `@tag` such as `@param` or `@returns`.
 * @param line The physical source line to test.
 * @returns `true` if the line starts a JSDoc tag.
 */
export function isJSDocTagLine(line: string): boolean {
    return /^\s*\*\s*@/.test(line)
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
