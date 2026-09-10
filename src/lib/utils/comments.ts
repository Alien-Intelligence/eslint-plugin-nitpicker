import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { isWordChar } from "@/lib/utils/words"

/**
 * The first prose character of a comment, with its absolute source index.
 */
type CommentContent = { index: number; char: string }

/**
 * A period inside a comment that punctuates prose rather than belonging to a
 * code token, with its absolute source index.
 */
export type ProsePeriod = {
    /**
     * The absolute source index of the period character.
     */
    index: number

    /**
     * Whether the period closes the comment, i.e. only whitespace follows it, so
     * removing it cannot run two sentences together.
     */
    terminal: boolean
}

/**
 * A backtick-fenced span inside a comment, with the absolute source indices of
 * its two backticks and the text they wrap.
 */
export type BacktickSpan = {
    /**
     * The absolute source index of the opening backtick.
     */
    start: number

    /**
     * The absolute source index of the closing backtick.
     */
    end: number

    /**
     * The text between the two backticks.
     */
    text: string
}

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
 * Checks whether a comment sits on a line of its own, i.e. only whitespace
 * precedes it, so it leads the code below rather than trailing the code beside
 * it.
 * @param sourceCode The source code of the linted file.
 * @param comment The comment to test.
 * @returns True if the comment starts its own line.
 */
export function isOwnLineComment(sourceCode: Readonly<TSESLint.SourceCode>, comment: TSESTree.Comment): boolean {
    const line = sourceCode.lines[comment.loc.start.line - 1] ?? ""

    return line.slice(0, comment.loc.start.column).trim() === ""
}

/**
 * Checks whether a comment sits directly above another, with no blank line
 * between them, so the two read as one block.
 * @param comment The upper comment.
 * @param below The comment it should lead.
 * @returns True if the two are adjacent.
 */
export function isAdjacentAbove(comment: TSESTree.Comment, below: TSESTree.Comment): boolean {
    return comment.loc.end.line === below.loc.start.line - 1
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
    // Skip past the opening "//" or "/*" delimiter
    const base = comment.range[0] + 2

    if (comment.type === "Line") {
        const match = comment.value.match(/\S/u)
        if (match?.index === undefined) return null

        return {
            index: base + match.index,
            char: match[0],
        }
    }

    let offset = 0
    for (const line of comment.value.split("\n")) {
        // Strip leading whitespace and a single " * " marker; whatever remains is
        // the line's content, so a marker-only line is skipped
        const markerLength = (line.match(/^\s*\*?\s*/u)?.[0] ?? "").length
        const char = line.slice(markerLength).charAt(0)

        if (char !== "") {
            return {
                index: base + offset + markerLength,
                char,
            }
        }

        offset += line.length + 1
    }

    return null
}

/**
 * Finds the periods inside a `//` comment that punctuate prose, skipping the ones
 * that belong to a code token (`foo.bar`, `subagent.*`), sit inside a quoted
 * span, form an ellipsis, or close an abbreviation such as `e.g.`.
 * @param comment The line comment to scan.
 * @returns The prose periods found, in source order.
 */
export function findProsePeriods(comment: TSESTree.Comment): ProsePeriod[] {
    const periods: ProsePeriod[] = []

    // The comment value starts right after the leading "//"
    const base = comment.range[0] + 2
    let quote: string | null = null

    for (let index = 0; index < comment.value.length; index++) {
        const char = comment.value.charAt(index)

        // Inside a quoted span everything is verbatim until it closes
        if (quote !== null) {
            if (char === quote) quote = null
            continue
        }

        // Only open a span when it actually closes, so an unpaired quote does not
        // swallow the rest of the comment
        if (CONSTANTS.COMMENTS.QUOTES.has(char) && comment.value.includes(char, index + 1)) {
            quote = char
            continue
        }

        if (char !== ".") continue

        // A run of consecutive dots is an ellipsis, leave it alone
        if (comment.value.charAt(index + 1) === ".") {
            while (comment.value.charAt(index + 1) === ".") index++
            continue
        }

        const rest = comment.value.slice(index + 1)

        // A dot is prose punctuation only when whitespace or the end of the
        // comment follows it, anything else makes it part of a token
        if (rest !== "" && !/^\s/u.test(rest)) continue

        if (endsWithAbbreviation(comment.value.slice(0, index + 1))) continue

        periods.push({
            index: base + index,
            terminal: rest.trim() === "",
        })
    }

    return periods
}

/**
 * Finds the backtick-fenced spans inside a comment, skipping runs of backticks
 * (a code fence), an unpaired backtick, and any span already holding a double
 * quote, none of which survive being rewritten as a quoted span.
 * @param comment The comment to scan.
 * @returns The spans found, in source order.
 */
export function findBacktickSpans(comment: TSESTree.Comment): BacktickSpan[] {
    const spans: BacktickSpan[] = []

    // The comment value starts right after the leading "//"
    const base = comment.range[0] + 2

    for (let index = 0; index < comment.value.length; index++) {
        if (comment.value.charAt(index) !== "`") continue

        // A run of backticks fences a code block, which quotes cannot stand in for
        if (comment.value.charAt(index + 1) === "`") {
            while (comment.value.charAt(index + 1) === "`") index++
            continue
        }

        const closing = comment.value.indexOf("`", index + 1)
        if (closing === -1) break

        const text = comment.value.slice(index + 1, closing)

        // Rewriting a span that already holds a double quote would nest quotes
        if (!text.includes('"')) {
            spans.push({
                start: base + index,
                end: base + closing,
                text,
            })
        }

        index = closing
    }

    return spans
}

/**
 * Checks whether a piece of comment text ends with an abbreviation whose
 * trailing dot is part of the word, e.g. `e.g.` or `etc.`.
 * @param text The comment text up to and including the dot.
 * @returns True if the dot closes an abbreviation.
 */
function endsWithAbbreviation(text: string): boolean {
    const lowercase = text.toLowerCase()

    return CONSTANTS.COMMENTS.ABBREVIATIONS.some(abbreviation => {
        if (!lowercase.endsWith(abbreviation)) return false

        // Require a boundary before the abbreviation so "foo.al" is not one
        const before = lowercase.charAt(lowercase.length - abbreviation.length - 1)
        return before === "" || !isWordChar(before)
    })
}
