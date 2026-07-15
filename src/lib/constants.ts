/**
 * The global set of constants shared across the plugin.
 */
const CONSTANTS = {
    /**
     * The short name the plugin is registered under inside an ESLint config,
     * e.g. `nitpicker/noEmDash`.
     */
    PLUGIN_NAME: "nitpicker",

    /**
     * The base URL of the plugin's repository.
     */
    REPO_URL: "https://github.com/the-alien-club/eslint-plugin-nitpicker",

    /**
     * The em dash character (U+2014), e.g. "—".
     */
    EM_DASH: "—",
} as const

export default CONSTANTS
