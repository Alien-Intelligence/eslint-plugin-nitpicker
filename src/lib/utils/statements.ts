import type { TSESLint, TSESTree } from "@typescript-eslint/utils"
import CONSTANTS from "@/lib/constants"
import { jsDocAnchor } from "@/lib/utils/jsdocs"

/**
 * Where a statement effectively begins once its leading comments are counted as
 * part of it, which is where a blank line has to go.
 */
export type StatementStart = {
    /**
     * The 1-based source line the statement effectively starts on.
     */
    line: number

    /**
     * The absolute source index of column 0 of that line.
     */
    index: number

    /**
     * The node a report should point at: the first leading comment when the
     * statement has one, otherwise the statement itself.
     */
    node: TSESTree.Node | TSESTree.Comment
}

/**
 * Checks whether a comment sits on a line of its own, i.e. nothing but
 * whitespace precedes it, so it leads the code below rather than trailing the
 * code beside it.
 * @param sourceCode The source code of the linted file.
 * @param comment The comment to test.
 * @returns True if the comment starts its own line.
 */
function isOwnLineComment(sourceCode: Readonly<TSESLint.SourceCode>, comment: TSESTree.Comment): boolean {
    const line = sourceCode.lines[comment.loc.start.line - 1] ?? ""
    return line.slice(0, comment.loc.start.column).trim() === ""
}

/**
 * Collects the comments that lead a statement, i.e. the unbroken run of own-line
 * comments directly above it, so a JSDoc or a `// Why` block counts as part of
 * the statement rather than as something separating it from the line above.
 * @param sourceCode The source code of the linted file.
 * @param statement The statement to inspect the leading comments of.
 * @returns The attached comments, top to bottom, empty when there are none.
 */
export function leadingStatementComments(
    sourceCode: Readonly<TSESLint.SourceCode>,
    statement: TSESTree.Node,
): TSESTree.Comment[] {
    const anchor = jsDocAnchor(statement)
    const before = sourceCode.getCommentsBefore(anchor)
    const attached: TSESTree.Comment[] = []

    let below = anchor.loc.start.line

    for (let index = before.length - 1; index >= 0; index--) {
        const comment = before[index]
        if (comment === undefined) break

        // A comment sharing its line with code trails that code, it does not lead us
        if (!isOwnLineComment(sourceCode, comment)) break

        // A blank line between the comment and what sits below detaches the two,
        // the end line is what matters so a multi-line JSDoc stays attached
        if (comment.loc.end.line < below - 1) break

        attached.unshift(comment)
        below = comment.loc.start.line
    }

    return attached
}

/**
 * Resolves where a statement effectively starts, counting its leading comments.
 * @param sourceCode The source code of the linted file.
 * @param statement The statement to locate.
 * @returns The effective start line, its source index, and the node to report on.
 */
export function statementStart(sourceCode: Readonly<TSESLint.SourceCode>, statement: TSESTree.Node): StatementStart {
    const node = leadingStatementComments(sourceCode, statement)[0] ?? statement

    return {
        line: node.loc.start.line,
        index: sourceCode.getIndexFromLoc({ line: node.loc.start.line, column: 0 }),
        node,
    }
}

/**
 * Checks whether a blank line sits above a statement's effective start. This is
 * false for the first statement of a block, whose line above is the opening
 * brace, since a brace is not a blank line.
 * @param sourceCode The source code of the linted file.
 * @param statement The statement to inspect.
 * @returns True if the line above the effective start is blank.
 */
export function hasBlankLineAbove(sourceCode: Readonly<TSESLint.SourceCode>, statement: TSESTree.Node): boolean {
    const above = sourceCode.lines[statementStart(sourceCode, statement).line - 2]
    return above === undefined || above.trim() === ""
}

/**
 * Checks whether a statement shares its first line with the statement above it,
 * as in a whole block written on one line.
 * @param sourceCode The source code of the linted file.
 * @param statement The statement to inspect.
 * @param previous The statement directly above it.
 * @returns True if the two share a source line.
 */
export function sharesLineWithPrevious(
    sourceCode: Readonly<TSESLint.SourceCode>,
    statement: TSESTree.Node,
    previous: TSESTree.Node,
): boolean {
    return statementStart(sourceCode, statement).line === previous.loc.end.line
}

/**
 * Unwraps a labeled statement to the statement it labels, so `outer: for (…)`
 * is judged as the loop it is.
 * @param statement The statement to unwrap.
 * @returns The labeled body, or the statement itself when it carries no label.
 */
export function unlabeled(statement: TSESTree.Node): TSESTree.Node {
    return statement.type === "LabeledStatement" ? statement.body : statement
}

/**
 * Checks whether a statement spans more than one source line.
 * @param statement The statement to measure.
 * @returns True if the statement is multi-line.
 */
export function isMultiline(statement: TSESTree.Node): boolean {
    return statement.loc.start.line !== statement.loc.end.line
}

/**
 * Checks whether a statement has a braced body, i.e. it opens a real block
 * rather than being a one-liner the formatter happened to wrap.
 * @param statement The statement to inspect.
 * @returns True if the statement's body is a block.
 */
export function hasBracedBody(statement: TSESTree.Node): boolean {
    switch (statement.type) {
        case "IfStatement":
            return statement.consequent.type === "BlockStatement"
        case "TryStatement":
        case "SwitchStatement":
            return true
        case "ForStatement":
        case "ForOfStatement":
        case "ForInStatement":
        case "WhileStatement":
        case "DoWhileStatement":
            return statement.body.type === "BlockStatement"
        default:
            return false
    }
}

/**
 * Checks whether a statement is a guard clause, i.e. a braceless `if` that only
 * jumps out. A guard filters the step it opens rather than starting a new one,
 * so a stack of them reads as a single thought.
 * @param statement The statement to inspect.
 * @returns True if the statement is a guard clause.
 */
export function isGuardClause(statement: TSESTree.Node): boolean {
    if (statement.type !== "IfStatement" || statement.alternate !== null) return false
    if (statement.consequent.type === "BlockStatement") return false

    return CONSTANTS.STATEMENTS.JUMPS.has(statement.consequent.type)
}

/**
 * Unwraps an awaited expression, so `await go()` is judged as the call it is.
 * @param expression The expression to unwrap.
 * @returns The awaited expression, or the expression itself.
 */
function unawaited(expression: TSESTree.Expression): TSESTree.Expression {
    return expression.type === "AwaitExpression" ? expression.argument : expression
}

/**
 * Walks a member or call chain down to the value it all hangs off, so
 * `table.text("name").notNullable()` roots at `table` rather than at the
 * intermediate call.
 * @param node The expression to walk down.
 * @returns The root of the chain.
 */
function chainRoot(node: TSESTree.Node): TSESTree.Node {
    let current = node
    while (current.type === "MemberExpression" || current.type === "CallExpression") {
        current = current.type === "MemberExpression" ? current.object : current.callee
    }

    return current
}

/**
 * Resolves the receiver an expression hangs off, e.g. `table` for
 * `table.text("name").notNullable()` and `assert` for `assert.equal(a, b)`.
 * @param sourceCode The source code of the linted file.
 * @param expression The expression to inspect.
 * @returns The receiver's source text, or `null` when there is no receiver.
 */
function receiverOf(sourceCode: Readonly<TSESLint.SourceCode>, expression: TSESTree.Expression): string | null {
    if (expression.type === "AssignmentExpression") {
        return expression.left.type === "MemberExpression" ? sourceCode.getText(chainRoot(expression.left)) : null
    }

    if (expression.type !== "CallExpression") return null

    // A bare call roots at the callee itself, which only groups repeats of the
    // same function, so a wall of differing calls stays prose
    return sourceCode.getText(chainRoot(expression))
}

/**
 * Resolves the shape a statement takes, so a run of statements built the same
 * way, e.g. a schema table, a block of assertions, or a stack of `useState`
 * calls, can be recognized as a table rather than as prose.
 * @param sourceCode The source code of the linted file.
 * @param statement The statement to inspect.
 * @returns A signature shared by parallel statements, or `null` when the statement has no such shape.
 */
export function parallelShape(sourceCode: Readonly<TSESLint.SourceCode>, statement: TSESTree.Node): string | null {
    // A one-line conditional assignment is still a row of the table it sits in
    if (statement.type === "IfStatement") {
        if (statement.alternate !== null || statement.consequent.type !== "ExpressionStatement") return null

        const shape = parallelShape(sourceCode, statement.consequent)
        return shape === null ? null : `guarded:${shape}`
    }

    if (statement.type === "ExpressionStatement") {
        const receiver = receiverOf(sourceCode, unawaited(statement.expression))
        return receiver === null ? null : `call:${receiver}`
    }

    if (statement.type !== "VariableDeclaration" || statement.declarations.length !== 1) return null

    const init = statement.declarations[0]?.init
    if (init === undefined || init === null) return null

    const receiver = receiverOf(sourceCode, unawaited(init))
    return receiver === null ? null : `declare:${receiver}`
}

/**
 * Checks whether a statement consumes a name the statement above it declares, so
 * the two read as one thought: seed a value, then immediately use it.
 * @param sourceCode The source code of the linted file.
 * @param previous The statement directly above.
 * @param statement The statement to test.
 * @returns True if the statement references something the previous one declares.
 */
export function consumesPreviousDeclaration(
    sourceCode: Readonly<TSESLint.SourceCode>,
    previous: TSESTree.Node,
    statement: TSESTree.Node,
): boolean {
    if (previous.type !== "VariableDeclaration") return false

    // Scope analysis rather than a name match, so a shadowed name cannot pass
    return sourceCode
        .getDeclaredVariables(previous)
        .some(variable =>
            variable.references.some(
                reference =>
                    reference.identifier.range[0] >= statement.range[0] &&
                    reference.identifier.range[1] <= statement.range[1],
            ),
        )
}

/**
 * Builds the fix inserting a blank line at a statement's effective start, at
 * column 0 so the existing indentation survives.
 * @param fixer The fixer to build the fix with.
 * @param start The effective start of the statement to separate.
 * @returns The insertion fix.
 */
export function blankLineFix(fixer: TSESLint.RuleFixer, start: StatementStart): TSESLint.RuleFix {
    return fixer.insertTextBeforeRange([start.index, start.index], "\n")
}
