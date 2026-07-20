import type { TSESLint, TSESTree } from "@typescript-eslint/utils"

/**
 * Checks whether a comment is a JSDoc comment, i.e. a block comment that opens
 * with `/**`.
 * @param comment The comment to test.
 * @returns `true` if the comment is a JSDoc block comment.
 */
export function isJsdocComment(comment: TSESTree.Comment): boolean {
    return comment.type === "Block" && comment.value.startsWith("*")
}

/**
 * Checks whether a node is immediately preceded by a JSDoc comment.
 * @param sourceCode The source code of the linted file.
 * @param node The node to inspect the leading comments of.
 * @returns `true` if the comment right before the node is a JSDoc comment.
 */
export function hasLeadingJsdoc(sourceCode: Readonly<TSESLint.SourceCode>, node: TSESTree.Node): boolean {
    const commentsBefore = sourceCode.getCommentsBefore(node)
    const closest = commentsBefore.at(-1)

    return closest !== undefined && isJsdocComment(closest)
}
