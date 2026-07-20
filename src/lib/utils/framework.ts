import type { TSESLint } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"

/**
 * A framework Nitpicker ships a dedicated rule category and shared config for.
 */
export type Framework = "adonisjs" | "react"

/**
 * The human-readable label for each framework, used in messages.
 */
export const FRAMEWORK_LABELS: Record<Framework, string> = {
    adonisjs: "AdonisJS",
    react: "React",
}

/**
 * Collects the module specifiers imported by a source file.
 * @param sourceCode The source code of the linted file.
 * @returns The list of imported module specifiers.
 */
function importSources(sourceCode: Readonly<TSESLint.SourceCode>): string[] {
    const sources: string[] = []

    for (const statement of sourceCode.ast.body) {
        if (statement.type === "ImportDeclaration") {
            sources.push(String(statement.source.value))
        }
    }

    return sources
}

/**
 * Detects which supported frameworks a file appears to use, based on its imports
 * and file name.
 * @param sourceCode The source code of the linted file.
 * @param filename The path of the linted file.
 * @returns The set of frameworks detected in the file.
 */
export function detectFrameworks(sourceCode: Readonly<TSESLint.SourceCode>, filename: string): Set<Framework> {
    const detected = new Set<Framework>()
    const sources = importSources(sourceCode)

    if (sources.some(source => source.startsWith("@adonisjs/") || CONSTANTS.ADONIS_SUBPATH.test(source))) {
        detected.add("adonisjs")
    }

    const importsReact = sources.some(
        source => source === "react" || source.startsWith("react/") || source === "react-dom",
    )
    if (importsReact || CONSTANTS.REACT_FILE.test(filename)) {
        detected.add("react")
    }

    return detected
}
