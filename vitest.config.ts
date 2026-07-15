import { defineConfig } from "vitest/config"

/**
 * The main configuration for the Vitest tests.
 */
export default defineConfig({
    resolve: {
        // Resolve the `@/*` path alias from tsconfig.json natively (Vite 8+).
        tsconfigPaths: true,
    },
    test: {
        globals: true,
        include: ["./tests/unit/**/*.test.ts"],
    },
})
