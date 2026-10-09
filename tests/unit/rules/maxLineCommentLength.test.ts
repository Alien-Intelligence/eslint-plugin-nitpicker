import { lintRule } from "tests/utils/lint"
import { describe, test } from "vitest"

const RULE = "max-line-comment-length"

// Six stacked lines of roughly 60 characters each, well past the 250 default
const WALL = [
    "// CRITICAL: attach the dispatching subagent's instanceKey so the",
    "// smoother and reducer can route this text into the right card",
    "// Without per-event identity, deltas from multiple subagents would",
    "// interleave character-by-character in the smoother's single buffer",
    "// MAIN-attributed text (parent agent narration / final synthesis)",
    "// is emitted with no instanceKey and renders at the assistant root",
].join("\n")

describe("max-line-comment-length", () => {
    test("It should not report a short line comment", ({ expect }) => {
        expect(lintRule(RULE, "// a short note\nconst a = 1")).toHaveLength(0)
    })

    test("It should not report a short run of line comments", ({ expect }) => {
        expect(lintRule(RULE, "// first note\n// second note\nconst a = 1")).toHaveLength(0)
    })

    test("It should report a long run of stacked line comments", ({ expect }) => {
        const messages = lintRule(RULE, `${WALL}\nconst a = 1`)
        expect(messages).toHaveLength(1)
        expect(messages[0]?.ruleId).toBe("nitpicker/max-line-comment-length")
        expect(messages[0]?.messageId).toBe("tooLong")
    })

    test("It should report the run once, not once per line", ({ expect }) => {
        expect(lintRule(RULE, `${WALL}\nconst a = 1`)).toHaveLength(1)
    })

    test("It should measure a run, not each line alone", ({ expect }) => {
        // Each line is far under the cap, only their sum crosses it
        const messages = lintRule(RULE, `${WALL}\nconst a = 1`)
        expect(messages[0]?.message).toContain("over the 200-character limit")
    })

    test("It should not join runs separated by a blank line", ({ expect }) => {
        const halves = WALL.split("\n")
        const split = `${halves.slice(0, 3).join("\n")}\n\n${halves.slice(3).join("\n")}\nconst a = 1`
        expect(lintRule(RULE, split)).toHaveLength(0)
    })

    test("It should not join runs separated by code", ({ expect }) => {
        const halves = WALL.split("\n")
        const split = `${halves.slice(0, 3).join("\n")}\nconst a = 1\n${halves.slice(3).join("\n")}\nconst b = 2`
        expect(lintRule(RULE, split)).toHaveLength(0)
    })

    test("It should report a four-line block that reads as a paragraph", ({ expect }) => {
        // Roughly 230 characters, under the old 250 cap but over the 200 default
        const code = [
            "// Terminal pause (ask_user), capture usage like completed and set an",
            '// "incomplete" stop reason so message-end signals "awaiting input"',
            '// rather than a normal finish, the preceding "ask-user" event',
            "// carries the question the consumer resumes",
            "const a = 1",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should not report a three-line block of ordinary prose", ({ expect }) => {
        const code = [
            "// Terminal pause (ask_user), capture usage like completed and set an",
            '// "incomplete" stop reason so message-end signals "awaiting input"',
            "// rather than a normal finish",
            "const a = 1",
        ].join("\n")
        expect(lintRule(RULE, code)).toHaveLength(0)
    })

    test("It should respect a custom max option", ({ expect }) => {
        const opts = { options: [{ max: 20 }] }
        expect(lintRule(RULE, "// first note\n// second note\nconst a = 1", opts)).toHaveLength(1)
    })

    test("It should not report a long JSDoc block", ({ expect }) => {
        const long = `/**\n * ${"word ".repeat(80)}\n */\nfunction f() {}`
        expect(lintRule(RULE, long)).toHaveLength(0)
    })

    test("It should ignore a directive comment in the run", ({ expect }) => {
        const code = `// biome-ignore lint/suspicious/noExplicitAny: needed\n${WALL}\nconst a = 1`
        // The directive breaks the run but the prose block after it still trips the cap
        expect(lintRule(RULE, code)).toHaveLength(1)
    })

    test("It should include AI-friendly why/fix context in the message", ({ expect }) => {
        const messages = lintRule(RULE, `${WALL}\nconst a = 1`)
        expect(messages[0]?.message).toContain("why:")
        expect(messages[0]?.message).toContain("fix:")
    })
})
