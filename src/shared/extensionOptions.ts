/**
 * Extension option definitions
 */
export interface ExtensionOptionDefinition {
    /**
     * Input type used to render the option and determine its stored value
     * type. 'checkbox' options are stored as boolean.
     */
    type: 'checkbox';
    /** Label shown next to the input (innerHTML for checkboxes) */
    label: string;
    /** Optional help text shown below the input */
    help?: string;
}

export const extensionOptions = {
    playerPageCompactMode: {
        type: 'checkbox',
        label: 'Enable compact player page',
    },
    ctrlFAutoSearch: {
        type: 'checkbox',
        label:
            'Use <kbd>Ctrl</kbd> + <kbd>F</kbd> (or <kbd>⌘</kbd> + <kbd>F</kbd>) to automatically search for players on server page',
    },
} as const satisfies Record<string, ExtensionOptionDefinition>;

/**
 * Typed stored values for all defined extension options.
 * Each option's value type is derived from its input type.
 */
export type ExtensionOptionsState = {
    [K in keyof typeof extensionOptions]: typeof extensionOptions[K]['type'] extends 'checkbox'
        ? boolean
        : string;
};
