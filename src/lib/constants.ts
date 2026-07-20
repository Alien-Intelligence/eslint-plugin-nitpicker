/**
 * The global set of constants shared across the plugin.
 */
const CONSTANTS = {
    /**
     * The short name the plugin is registered under inside an ESLint config,
     * e.g. `nitpicker/no-em-dash`.
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

    /**
     * Matches a single "word" character, i.e. anything that can appear inside an
     * identifier or a number (letters, digits, underscore and dollar).
     */
    WORD_CHAR: /[\p{L}\p{N}_$]/u,

    /**
     * AdonisJS subpath import roots (`#models/...`, `#controllers/...`, etc.).
     */
    ADONIS_SUBPATH:
        /^#(models|controllers|services|middleware|validators|policies|config|start|database|providers|lib)\b/,

    /**
     * React source files by extension.
     */
    REACT_FILE: /\.[jt]sx$/,
} as const

export default CONSTANTS
