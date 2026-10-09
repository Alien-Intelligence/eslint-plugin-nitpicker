import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { isDirectiveComment } from "@/lib/utils/comments"

/**
 * A block tag found in a JSDoc, e.g. `@param url The link`.
 */
export type JSDocTag = {
    /**
     * The tag name without its `@`, e.g. `param`.
     */
    name: string

    /**
     * The absolute source index of the tag's `@`.
     */
    index: number

    /**
     * The absolute source index of the end of the tag's own line.
     */
    lineEnd: number

    /**
     * Everything after the tag name, continuation lines included, with the
     * ` * ` markers stripped.
     */
    body: string
}

/**
 * What a value-documenting tag says, split into the parameter it names (if any)
 * and the description that follows.
 */
export type JSDocTagParts = {
    /**
     * The documented parameter name, e.g. `input.id`, or `null` for a tag that
     * names none, such as `@returns`.
     */
    name: string | null

    /**
     * The description prose, empty when the tag stops after its type or name.
     */
    description: string
}

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
 * Resolves the node a JSDoc comment sits above, which for a decorated
 * declaration is its earliest decorator, since decorators are written between the
 * JSDoc and the declaration they belong to.
 * @param node The node to anchor the JSDoc lookup on.
 * @returns The node whose leading comments hold the JSDoc.
 */
export function jsDocAnchor(node: TSESTree.Node): TSESTree.Node {
    const declaration =
        (node.type === "ExportDefaultDeclaration" || node.type === "ExportNamedDeclaration") &&
        node.declaration !== null
            ? node.declaration
            : node

    const decorators = "decorators" in declaration ? declaration.decorators : undefined

    // Only a decorator written before the declaration shifts the anchor, the
    // "export default @dec class" form leaves the JSDoc above the export
    const earliest = decorators?.reduce<TSESTree.Decorator | undefined>(
        (found, decorator) => (found === undefined || decorator.range[0] < found.range[0] ? decorator : found),
        undefined,
    )

    return earliest !== undefined && earliest.range[0] < node.range[0] ? earliest : node
}

/**
 * Resolves the JSDoc comment documenting a node, if it has one.
 * @param sourceCode The source code of the linted file.
 * @param node The node to inspect the leading comments of.
 * @returns The JSDoc comment, or `null` when the node is undocumented.
 */
export function getLeadingJSDoc(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Node,
): TSESTree.Comment | null {
    const commentsBefore = sourceCode.getCommentsBefore(jsDocAnchor(node))

    // Skip trailing ignore directives (biome-ignore, eslint-*, @ts-*) that can
    // sit between the JSDoc and the node, so the JSDoc above them still counts
    let index = commentsBefore.length - 1
    while (index >= 0) {
        const comment = commentsBefore[index]
        if (comment === undefined || !isDirectiveComment(comment)) break
        index--
    }

    const closest = commentsBefore[index]
    return closest !== undefined && isJSDocComment(closest) ? closest : null
}

/**
 * Collects the parameter names a JSDoc documents, keyed on the root name so a
 * dotted member tag such as `@param input.id` counts as documenting `input`.
 * @param comment The JSDoc comment to read.
 * @returns The documented parameter names.
 */
export function getJSDocParamNames(comment: TSESTree.Comment): Set<string> {
    const names = new Set<string>()

    for (const line of comment.value.split("\n")) {
        const name = line.match(CONSTANTS.JSDOC.PARAM_TAG)?.[1]
        if (name !== undefined) names.add(name)
    }

    return names
}

/**
 * Checks whether a JSDoc carries a `@returns` (or `@return`) tag.
 * @param comment The JSDoc comment to read.
 * @returns True if the JSDoc documents a return value.
 */
export function hasJSDocReturnsTag(comment: TSESTree.Comment): boolean {
    return comment.value.split("\n").some(line => {
        const tag = getJSDocLineTag(line)
        return tag === "returns" || tag === "return"
    })
}

/**
 * Checks whether a node is immediately preceded by a JSDoc comment.
 * @param sourceCode The source code of the linted file.
 * @param node The node to inspect the leading comments of.
 * @returns True if the comment right before the node is a JSDoc comment.
 */
export function hasLeadingJSDoc(sourceCode: Readonly<TSESLint.SourceCode>, node: TSESTree.Node): boolean {
    return getLeadingJSDoc(sourceCode, node) !== null
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
 * Collects the block tags of a JSDoc, each with the lines that continue it up to
 * the next tag or the end of the comment.
 * @param comment The JSDoc comment to read.
 * @returns The tags, in source order.
 */
export function getJSDocTags(comment: TSESTree.Comment): JSDocTag[] {
    const tags: JSDocTag[] = []

    // The comment value starts right after the opening "/*"
    let offset = comment.range[0] + 2

    for (const line of comment.value.split("\n")) {
        const name = getJSDocLineTag(line)
        const last = tags.at(-1)

        if (name !== null) {
            const at = line.indexOf("@")

            tags.push({
                name,
                index: offset + at,
                lineEnd: offset + line.trimEnd().length,
                body: line.slice(at + 1 + name.length),
            })
        } else if (last !== undefined) {
            last.body += `\n${line.replace(CONSTANTS.JSDOC.LINE_MARKER, "")}`
        }

        offset += line.length + 1
    }

    return tags
}

/**
 * Finds where a bracketed group closes, counting nested pairs so a type such as
 * `{Promise<{ id: string }>}` is skipped whole.
 * @param text The text that opens with the group.
 * @param open The opening bracket.
 * @param close The closing bracket.
 * @returns The index just past the closing bracket, or the text length if the
 * group never closes.
 */
function skipGroup(text: string, open: string, close: string): number {
    let depth = 0

    for (let index = 0; index < text.length; index++) {
        if (text.charAt(index) === open) depth++
        if (text.charAt(index) === close) depth--
        if (depth === 0) return index + 1
    }

    return text.length
}

/**
 * Splits a value-documenting tag into the parameter it names and its
 * description, skipping a leading `{Type}`, an optional `[name=default]`, and the
 * `-` some writers put before the description.
 * @param tag The tag to split.
 * @returns The documented name and the description.
 */
export function getJSDocTagParts(tag: JSDocTag): JSDocTagParts {
    let rest = tag.body.trim()

    // A leading brace is the type, unless it opens an inline tag like "{@link}"
    if (rest.startsWith("{") && !rest.startsWith("{@")) {
        rest = rest.slice(skipGroup(rest, "{", "}")).trimStart()
    }

    let name: string | null = null

    if (tag.name === "param" && rest !== "") {
        const end = rest.startsWith("[") ? skipGroup(rest, "[", "]") : (rest.match(/^\S+/)?.[0].length ?? 0)

        name =
            rest
                .slice(0, end)
                .replace(/^\[|\]$/g, "")
                .split("=")[0]
                ?.trim() ?? null
        rest = rest.slice(end)
    }

    return {
        name,
        description: rest
            .trim()
            .replace(/^-(?:\s+|$)/, "")
            .trim(),
    }
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
