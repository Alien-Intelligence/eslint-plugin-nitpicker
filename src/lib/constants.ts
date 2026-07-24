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

    /**
     * Box-drawing and block-element characters, which are always decorative
     * when found inside a comment.
     */
    BOX_DRAWING: /[─-▟]/,

    /**
     * A comment line made entirely of three or more repeated separator
     * characters, e.g. `======` or `------`.
     */
    PURE_SEPARATOR: /^[-=~*#_+]{3,}$/,

    /**
     * A short label fenced by separator runs inside a comment, e.g `-- Section --`.
     */
    WRAPPED_LABEL: /^[-=~*#_+]{2,}\s.*\s[-=~*#_+]{2,}$/,

    /**
     * Matches a single sub-word: an all-caps acronym, a capitalized word, or a
     * lowercase run, so `getUserName` splits into "get", "User" and "Name"
     */
    SUB_WORD: /[A-Z]+(?![a-z])|[A-Z][a-z]+|[a-z]+/g,
} as const

export default CONSTANTS
