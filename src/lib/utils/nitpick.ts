/**
 * The building blocks of a Nitpicker message, every rule reports its findings
 * through this shape so that the output is consistent and, crucially,
 * self-explanatory enough for an AI (or a human) to fix the issue without
 * opening the rule's documentation.
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
 * Composes a {@link Nitpick} into one message string for a rule's
 * `meta.messages` entry, leaving any ESLint `{{placeholders}}` intact.
 * @param nitpick The problem/why/fix triplet to format.
 * @returns The formatted, multi-line message.
 */
export function nitpick({ problem, why, fix }: Nitpick): string {
    return `${problem}\n  - why: ${why}\n  - fix: ${fix}`
}
