/**
 * British English spellings mapped to their American equivalents, keyed in
 * lowercase. Extend it per project via the `no-british-english` rule's `extra`
 * option.
 */
export const BRITISH_TO_AMERICAN: Record<string, string> = {
    // "-our" to "-or"
    colour: "color",
    colours: "colors",
    coloured: "colored",
    colouring: "coloring",
    behaviour: "behavior",
    behaviours: "behaviors",
    favourite: "favorite",
    favourites: "favorites",
    flavour: "flavor",
    flavours: "flavors",
    honour: "honor",
    labour: "labor",
    neighbour: "neighbor",

    // "-ise" to "-ize" and their inflections
    normalise: "normalize",
    normalised: "normalized",
    normalising: "normalizing",
    normalisation: "normalization",
    initialise: "initialize",
    initialises: "initializes",
    initialised: "initialized",
    initialising: "initializing",
    initialisation: "initialization",
    serialise: "serialize",
    serialised: "serialized",
    serialising: "serializing",
    serialisation: "serialization",
    organise: "organize",
    organised: "organized",
    organising: "organizing",
    organisation: "organization",
    optimise: "optimize",
    optimised: "optimized",
    optimising: "optimizing",
    optimisation: "optimization",
    customise: "customize",
    customised: "customized",
    customising: "customizing",
    sanitise: "sanitize",
    sanitised: "sanitized",
    sanitising: "sanitizing",
    synchronise: "synchronize",
    synchronised: "synchronized",
    synchronising: "synchronizing",
    authorise: "authorize",
    authorised: "authorized",
    authorising: "authorizing",
    finalise: "finalize",
    finalised: "finalized",
    finalising: "finalizing",
    capitalise: "capitalize",
    capitalised: "capitalized",
    capitalising: "capitalizing",
    categorise: "categorize",
    categorised: "categorized",

    // "-yse" to "-yze"
    analyse: "analyze",
    analysed: "analyzed",
    analysing: "analyzing",

    // "-re" to "-er"
    centre: "center",
    centred: "centered",
    centres: "centers",
    fibre: "fiber",
    metre: "meter",

    // "-ce" to "-se"
    licence: "license",
    defence: "defense",
    offence: "offense",

    // Doubled "l" in inflections
    cancelled: "canceled",
    cancelling: "canceling",
    labelled: "labeled",
    labelling: "labeling",
    modelling: "modeling",
    travelled: "traveled",

    // Miscellaneous
    grey: "gray",
    dialogue: "dialog",
    catalogue: "catalog",
}
