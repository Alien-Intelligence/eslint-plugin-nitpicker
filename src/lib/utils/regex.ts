/**
 * Converts a glob pattern into an anchored regular expression, supporting `*`
 * (any run within a path segment) and `**` (any run across segments).
 * @param glob The glob pattern to convert.
 * @returns The equivalent regular expression.
 */
function globToRegExp(glob: string): RegExp {
    const normalized = glob.replace(/\\/g, "/")
    let pattern = "^"

    for (let index = 0; index < normalized.length; index++) {
        const char = normalized[index]
        if (char === undefined) break

        if (char === "*") {
            if (normalized[index + 1] === "*") {
                pattern += ".*"
                index++

                // If the `**` is followed by a `/`, skip it so that `**/` and `**` are equivalent
                if (normalized[index + 1] === "/") index++
            } else {
                pattern += "[^/]*"
            }
        } else if ("\\^$.|?+()[]{}".includes(char)) {
            pattern += `\\${char}`
        } else {
            pattern += char
        }
    }

    return new RegExp(`${pattern}$`)
}

/**
 * Checks whether a file path matches any of the given glob patterns, comparing
 * with forward slashes so it works the same on every platform.
 * @param filename The file path to test.
 * @param patterns The glob patterns to match against.
 * @returns True if the path matches at least one pattern.
 */
export function matchesGlob(filename: string, patterns: string[]): boolean {
    const path = filename.replace(/\\/g, "/")

    return patterns.some(pattern => globToRegExp(pattern).test(path))
}
