/**
 * Extension option definitions
 *
 */
export interface ExtensionOptionDefinition {
    /**
     * Input type used to render the option and determine its stored value
     * type. 'checkbox' options are stored as boolean, text inputs as string.
     */
    type: 'checkbox' | 'password';
    /** Label shown next to the input (innerHTML for checkboxes) */
    label: string;
    /** Optional help text shown below the input */
    help?: string;
    /** Optional placeholder for text inputs */
    placeholder?: string;
}

export const extensionOptions = {
    playerPageCompactMode: {
        type: 'checkbox',
        label: 'Enable compact player page',
    },
    ctrlFAutoSearch: {
        type: 'checkbox',
        label: 'Use <kbd>Ctrl</kbd> + <kbd>F</kbd> (or <kbd>⌘</kbd> + <kbd>F</kbd>) to automatically search for players on server page',
    },
    apiKey: {
        type: 'password',
        label: 'BattleMetrics API Key',
        help: 'Optional. Enables previous identifiers and session history.<br>The API key is stored locally, and only sent to BattleMetrics.<br>Learn how to get an API key here: <a href="https://www.youtube.com/watch?v=XiUS0lbnTdw" target="_blank" rel="noopener noreferrer">link</a>',
        placeholder: 'Enter API key...',
    },
} as const satisfies Record<string, ExtensionOptionDefinition>;

/**
 * Typed stored values for all defined extension options.
 * Each option's value type is derived from its input type.
 */
export type ExtensionOptionsState = {
    [K in keyof typeof extensionOptions]: (typeof extensionOptions)[K]['type'] extends 'checkbox'
        ? boolean
        : string;
};
