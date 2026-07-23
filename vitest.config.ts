import { defineConfig } from "vitest/config"

/**
 * The main configuration for the Vitest tests.
 */
export default defineConfig({
    resolve: {
        // Resolve the `@/*` path alias from tsconfig.json natively (Vite 8+)
        tsconfigPaths: true,
    },
    test: {
        globals: true,
        include: ["./tests/unit/**/*.test.ts"],

        // ESLint and its parser are CJS deps, running test files in one worker
        // avoids a cold dep-optimizer race that intermittently fails their import
        fileParallelism: false,
    },
})
