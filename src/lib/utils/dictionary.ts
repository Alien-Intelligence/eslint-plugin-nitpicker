/**
 * Merges a base lookup with extra entries and removes ignored keys, keying everything in lowercase
 * for case-insensitive lookups. Used to let a rule's built-in table be extended or narrowed
 * through its options.
 * @param base The built-in lookup.
 * @param extra Additional entries to add or override.
 * @param ignore Keys to remove from the result.
 * @returns The merged, lowercase-keyed lookup.
 */
export function buildDictionary(
    base: Record<string, string>,
    extra: Record<string, string>,
    ignore: string[],
): Record<string, string> {
    const dictionary: Record<string, string> = {}

    for (const [key, value] of Object.entries(base)) {
        dictionary[key.toLowerCase()] = value
    }

    for (const [key, value] of Object.entries(extra)) {
        dictionary[key.toLowerCase()] = value
    }

    for (const key of ignore) {
        delete dictionary[key.toLowerCase()]
    }

    return dictionary
}
