import { rmSync } from "node:fs"
import copyfiles from "copyfiles"
import { defineConfig, type Format, type Options } from "tsup"

// Delete dist folder before building
try {
    rmSync("./dist", { recursive: true, force: true })
} catch (_) {
    // Do nothing
}

/**
 * Common configuration for all builds.
 */
const commonConfig: Options = {
    format: "esm" as Format,
    sourcemap: true,
    dts: true,
    shims: true,
    treeshake: true,
    minify: true,

    /**
     * Note: Clean up is disabled because it causes some DTS files to be deleted during build.
     */
    clean: false,
}

export default defineConfig([
    // Main entry config
    {
        ...commonConfig,
        entry: ["src/index.ts"],
        platform: "node",
        target: "node20",
        async onSuccess() {
            console.info("\nIncluding miscellaneous files to dist:")

            copyfiles(["./package.json", "./dist"], () => null)
            console.info("> Copied package.json to dist")

            copyfiles(["./README.md", "./dist"], () => null)
            console.info("> Copied README.md to dist")

            copyfiles(["./LICENSE", "./dist"], () => null)
            console.info("> Copied LICENSE to dist")

            console.info("> Copied all config files\n")
        },
    },
])
