/**
 * The building blocks of a Nitpicker message.
 *
 * Every rule reports its findings through this shape so that the output is
 * consistent and, crucially, self-explanatory enough for an AI (or a human) to
 * fix the issue without opening the rule's documentation.
 */
export type Nitpick = {
    /**
     * What is wrong, stated plainly. May contain ESLint `{{placeholders}}`.
     */
    problem: string

    /**
     * Why it is worth fixing, so the reader understands the intent.
     */
    why: string

    /**
     * A concrete, actionable instruction describing how to fix it.
     */
    fix: string
}

/**
 * Composes a {@link Nitpick} into a single, richly-contextualized message
 * string suitable for a rule's `meta.messages` entry.
 *
 * ESLint `{{placeholders}}` inside any field are preserved untouched, so they
 * can still be interpolated with `data` at report time.
 * @param nitpick The problem/why/fix triplet to format.
 * @returns The formatted, multi-line message.
 */
export function nitpick({ problem, why, fix }: Nitpick): string {
    return `${problem}\n  - why: ${why}\n  - fix: ${fix}`
}
