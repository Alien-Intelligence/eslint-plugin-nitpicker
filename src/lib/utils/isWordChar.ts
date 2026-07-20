import CONSTANTS from "@/lib/constants"

/**
 * Checks whether a character is a "word" character, i.e. something that can
 * appear inside an identifier or a number (letters, digits, underscore, dollar).
 * @param char The single character to test, or `undefined` (e.g. past the end
 * of a string).
 * @returns `true` if the character is a word character, `false` otherwise.
 */
export function isWordChar(char: string | undefined): boolean {
    return char !== undefined && CONSTANTS.WORD_CHAR.test(char)
}
