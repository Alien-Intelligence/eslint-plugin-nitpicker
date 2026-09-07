import { describe, test } from "vitest"
import plugin from "@/index"
import { rules } from "@/rules"

/**
 * The breathing rules, which rewrite the whitespace of an existing codebase and
 * so must stay out of every config a project gets by default.
 */
const BREATHING_RULES = [
    "nitpicker/require-blank-before-return",
    "nitpicker/require-blank-before-block",
    "nitpicker/max-consecutive-statements",
]

/**
 * Reads the rule names one of the plugin's shared configs enables.
 * @param name The config name to read.
 * @returns The enabled rule names.
 */
function ruleNamesOf(name: string): string[] {
    return Object.keys(plugin.configs?.[name]?.rules ?? {})
}

describe("shared configs", () => {
    test("It should ship every documented config", ({ expect }) => {
        expect(Object.keys(plugin.configs ?? {}).sort()).toEqual([
            "adonisjs",
            "all",
            "base",
            "breathing",
            "react",
            "recommended",
        ])
    })

    test.each(["base", "recommended"])("It should keep the breathing rules out of %s", name => {
        const enabled = ruleNamesOf(name)
        expect(enabled.length).toBeGreaterThan(0)

        for (const rule of BREATHING_RULES) {
            expect(enabled).not.toContain(rule)
        }
    })

    test("It should enable exactly the breathing rules in breathing", ({ expect }) => {
        expect(ruleNamesOf("breathing").sort()).toEqual([...BREATHING_RULES].sort())
    })

    test("It should enable every rule in all", ({ expect }) => {
        expect(ruleNamesOf("all")).toHaveLength(Object.keys(rules).length)

        for (const rule of BREATHING_RULES) {
            expect(ruleNamesOf("all")).toContain(rule)
        }
    })

    test("It should give every rule a category that maps to a shipped config", ({ expect }) => {
        const categories = new Set(Object.values(rules).map(rule => rule.meta.docs?.category ?? "base"))
        expect([...categories].sort()).toEqual(["adonisjs", "base", "breathing", "react"])
    })
})
