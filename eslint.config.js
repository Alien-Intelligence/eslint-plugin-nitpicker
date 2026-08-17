import tsParser from "@typescript-eslint/parser"
import nitpicker from "./dist/index.js"

/**
 * A minimal flat config that dog-foods the Nitpicker plugin on this repository,
 * with no other plugins enabled.
 */
export default [
    {
        files: ["src/**/*.ts", "tests/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
        },
        plugins: { nitpicker },
        rules: nitpicker.configs.recommended.rules,
    },
    {
        // These files must contain the em dash character itself (the rule's own
        // constant, description, messages, and test fixtures), so they are
        // exempt from the em dash rule
        files: ["src/lib/constants.ts", "src/rules/base/noEmDash.ts", "tests/unit/rules/noEmDash.test.ts"],
        rules: { "nitpicker/no-em-dash": "off" },
    },
    {
        // This test fixture must contain emoji characters, so it is exempt from
        // the emoji rule
        files: ["tests/unit/rules/noEmojis.test.ts"],
        rules: { "nitpicker/no-emojis": "off" },
    },
    {
        // The British-to-American dictionary defines British words as its keys,
        // so it is exempt from the British-English rule
        files: ["src/lib/data/britishToAmerican.ts"],
        rules: { "nitpicker/no-british-english": "off" },
    },
]
