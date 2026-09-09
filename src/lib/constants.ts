/**
 * The global set of constants shared across the plugin, grouped by domain.
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
    REPO_URL: "https://github.com/Alien-Intelligence/eslint-plugin-nitpicker",

    /**
     * The em dash character (U+2014), e.g. "—".
     */
    EM_DASH: "—",

    /**
     * Matches a single emoji as one unit: flag pairs, skin-tone and
     * variation-selector modifiers, and ZWJ sequences. Text-default pictographs
     * like © match only when emoji-styled with a variation selector.
     */
    EMOJI: /\p{Regional_Indicator}\p{Regional_Indicator}|\p{Emoji_Presentation}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Emoji_Presentation}(?:\uFE0F|\p{Emoji_Modifier})?)*|\p{Extended_Pictographic}\uFE0F/gu,

    /**
     * Constants for scanning comments.
     */
    COMMENTS: {
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
         * A tooling directive comment (eslint, ts-, biome-ignore, etc.) rather
         * than prose, matched against the comment text.
         */
        DIRECTIVE:
            /^\s*(?:eslint\b|eslint-|globals?\b|exported\b|jshint\b|jslint\b|istanbul\b|[cv]8\b|ts-|prettier-ignore|biome-ignore|webpack\b|noinspection\b|@)/,

        /**
         * Quote characters that fence a verbatim span inside a comment, whose
         * dots belong to the quoted text rather than the surrounding prose. The
         * apostrophe is absent, as it appears unpaired in words like "don't".
         */
        QUOTES: new Set(['"', "`"]),

        /**
         * Abbreviations whose trailing dot is part of the word itself, so it must
         * survive even though it looks like the end of a sentence.
         */
        ABBREVIATIONS: ["e.g.", "i.e.", "etc.", "vs.", "cf.", "al.", "approx.", "resp."],

        /**
         * The default maximum prose length of a run of consecutive line comments,
         * tighter than a JSDoc description since a stacked wall reads worse.
         */
        MAX_RUN_LENGTH: 200,
    },

    /**
     * Constants for inspecting JSDoc structure.
     */
    JSDOC: {
        /**
         * Matches a JSDoc block-tag line, capturing the tag name so callers can
         * find any tag (`param`, `returns`, `throws`, etc.).
         */
        TAG: /^\s*\*?\s*@(\w+)/,

        /**
         * Matches an `@param` line and captures the documented name, tolerating a
         * leading `{Type}` and an optional `[name]` or `[name=default]` form. A
         * dotted member such as `input.id` captures its root, `input`.
         */
        PARAM_TAG: /^\s*\*?\s*@param\s+(?:\{[^}]*\}\s*)?\[?([\w$]+)/,

        /**
         * The default maximum character length of a JSDoc description.
         */
        MAX_DESCRIPTION_LENGTH: 250,
    },

    /**
     * Constants for splitting and inspecting words.
     */
    WORDS: {
        /**
         * Matches a single "word" character, i.e. anything that can appear inside
         * an identifier or a number (letters, digits, underscore and dollar).
         */
        WORD_CHAR: /[\p{L}\p{N}_$]/u,

        /**
         * Matches a single sub-word: an all-caps acronym, a capitalized word, or a
         * lowercase run, so `getUserName` splits into "get", "User" and "Name"
         */
        SUB_WORD: /[A-Z]+(?![a-z])|[A-Z][a-z]+|[a-z]+/g,
    },

    /**
     * Constants for object literals.
     */
    OBJECTS: {
        /**
         * The default maximum number of properties an object literal may keep on
         * a single line before it must be broken across multiple lines.
         */
        MAX_INLINE_KEYS: 2,

        /**
         * The default number of spaces per indentation level used when expanding
         * an object literal across multiple lines.
         */
        INDENT_WIDTH: 4,
    },

    /**
     * Constants for inspecting functions.
     */
    FUNCTIONS: {
        /**
         * The AST node types that introduce a new function scope.
         */
        NODE_TYPES: new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]),
    },

    /**
     * Constants for inspecting statement lists and their spacing.
     */
    STATEMENTS: {
        /**
         * The control-flow statements that own a body, so they read as a block
         * and need air above them.
         */
        CONTROL_FLOW: new Set([
            "IfStatement",
            "ForStatement",
            "ForOfStatement",
            "ForInStatement",
            "WhileStatement",
            "DoWhileStatement",
            "TryStatement",
            "SwitchStatement",
        ]),

        /**
         * The statements that conclude a block by leaving it.
         */
        EXITS: new Set(["ReturnStatement", "ThrowStatement"]),

        /**
         * The statements that jump out of the current step, which is what makes
         * a braceless `if` a guard clause rather than a branch.
         */
        JUMPS: new Set(["ReturnStatement", "ThrowStatement", "ContinueStatement", "BreakStatement"]),

        /**
         * The default block size at which a trailing exit needs a blank line
         * above it, counting the exit itself.
         */
        MIN_STATEMENTS_BEFORE_EXIT: 4,

        /**
         * The default maximum run of sibling statements with no blank line
         * between them.
         */
        MAX_CONSECUTIVE: 4,
    },

    /**
     * Constants for detecting framework usage.
     */
    FRAMEWORKS: {
        /**
         * AdonisJS subpath import roots (`#models/...`, `#controllers/...`, etc.).
         */
        ADONIS_SUBPATH:
            /^#(models|controllers|services|middleware|validators|policies|config|start|database|providers|lib)\b/,

        /**
         * React source files by extension.
         */
        REACT_FILE: /\.[jt]sx$/,
    },

    /**
     * Constants for React semantics.
     */
    REACT: {
        /**
         * A React hook name: `use` followed by a capitalized word, e.g.
         * `useState` or `useMenuActions`.
         */
        HOOK: /^use[A-Z]/,

        /**
         * A context-consumer hook name, i.e. a `use…Context` wrapper such as
         * `useTreeViewContext` (the bare `useContext` is excluded).
         */
        CONTEXT_HOOK: /^use[A-Z]\w*Context$/,

        /**
         * The memoization hooks whose result is worth documenting with a JSDoc.
         */
        MEMO_HOOKS: new Set(["useMemo", "useCallback"]),

        /**
         * The default maximum length of a `className` class string.
         */
        MAX_CLASSNAME_LENGTH: 120,
    },

    /**
     * Constants for the design-system rules.
     */
    DESIGN: {
        /**
         * A CSS hex color literal, in the four lengths CSS actually allows:
         * `#rgb`, `#rgba`, `#rrggbb` and `#rrggbbaa`. Five and seven digits are
         * excluded, since neither is a color.
         */
        HEX_COLOR: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/,

        /**
         * The bare HTML form controls a design system replaces with a primitive,
         * mapped to the primitive name by capitalizing the tag.
         */
        RAW_CONTROLS: ["button", "input", "select", "textarea"],

        /**
         * The Tailwind property prefixes whose arbitrary px value bypasses the
         * type and spacing scales, e.g. `text-[10px]` or `w-[774px]`.
         */
        SCALE_PROPERTIES: ["w", "h", "p", "px", "py", "m", "mx", "my", "gap", "text", "size"],

        /**
         * Matches a Tailwind arbitrary value given in px, e.g. `[10px]`.
         */
        ARBITRARY_PX: /-\[\d+px\]/,

        /**
         * The three ingredients that together draw a card surface: a rounded
         * corner, a border on every side, and a card or page background. A
         * single-side border (`border-t` and friends) is a divider rather than a
         * surface, so it is excluded.
         */
        SURFACE: [/\brounded-(?:md|lg|xl)\b/, /\bborder\b(?!-[trblxyse]\b)/, /\bbg-(?:card|background)\b/],

        /**
         * A raw Tailwind palette class, i.e. a named hue with a numeric scale
         * step, which is what a semantic variant must not reach for.
         */
        RAW_PALETTE: /\b(?:red|green|amber|yellow|blue|orange)-\d{2,3}\b/,

        /**
         * The semantic variant names that carry a meaning the status tokens own,
         * mapped to the token each one belongs to.
         */
        STATUS_TOKENS: {
            success: "--success",
            warning: "--warning",
            error: "--error",
            destructive: "--destructive",
            info: "--info",
        },

        /**
         * The class-variance-authority factory whose `variants.variant` map holds
         * a component's semantic variants.
         */
        VARIANT_FACTORY: "cva",
    },

    /**
     * Constants for AdonisJS request handling.
     */
    REQUEST: {
        /**
         * The raw request accessors that read request data directly, bypassing
         * the Vine validator contract.
         */
        RAW_ACCESSORS: new Set(["input", "body", "qs", "all", "only", "except"]),
    },

    /**
     * Constants for AdonisJS migrations.
     */
    MIGRATIONS: {
        /**
         * Table-builder methods that declare an index or a constraint.
         */
        INDEX_METHODS: new Set(["index", "unique", "primary", "foreign"]),

        /**
         * Table-builder methods that declare a timestamp column.
         */
        TIMESTAMP_METHODS: new Set(["timestamp", "dateTime", "datetime"]),

        /**
         * Audit timestamp column names that form a migration's dedicated
         * timestamps group.
         */
        AUDIT_TIMESTAMPS: new Set(["created_at", "updated_at", "deleted_at"]),

        /**
         * The order table statements must be grouped in: columns first, then
         * timestamps, then indexes and constraints.
         */
        CATEGORY_ORDER: ["column", "timestamp", "index"],
    },
} as const

export default CONSTANTS
