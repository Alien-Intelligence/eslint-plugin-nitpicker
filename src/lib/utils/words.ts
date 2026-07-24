import CONSTANTS from "@/lib/constants"

/**
 * A sub-word found in a piece of text, with its start offset.
 */
export type Word = {
    /**
     * The sub-word, in its original casing.
     */
    text: string

    /**
     * The offset of the sub-word within the source text.
     */
    index: number
}

/**
 * Splits a piece of text into its sub-words, handling camelCase, PascalCase,
 * snake_case, and plain prose.
 * @param text The text to split.
 * @returns The sub-words found, each with its offset in the text.
 */
export function extractWords(text: string): Word[] {
    const words: Word[] = []

    for (const match of text.matchAll(CONSTANTS.SUB_WORD)) {
        if (match.index !== undefined) {
            words.push({ text: match[0], index: match.index })
        }
    }

    return words
}

/**
 * Rewrites a replacement word to match the casing of the word it replaces, so a
 * capitalized source yields a capitalized result and an all-caps source an
 * all-caps one.
 * @param source The original word whose casing should be mirrored.
 * @param replacement The lowercase replacement word.
 * @returns The replacement, cased like the source.
 */
export function matchCase(source: string, replacement: string): string {
    if (source === source.toUpperCase()) {
        return replacement.toUpperCase()
    }

    if (source.charAt(0) === source.charAt(0).toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1)
    }

    return replacement
}
