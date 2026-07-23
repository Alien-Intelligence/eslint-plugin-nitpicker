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
]
