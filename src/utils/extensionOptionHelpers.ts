import browser from 'webextension-polyfill';
import {
    extensionOptions,
    ExtensionOptionsState,
} from '../shared/extensionOptions';

let statusTextTimeout: number | undefined;
let cachedApiKey: string | null | undefined;

// Clear cachedApiKey on api key change
browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && 'apiKey' in changes) {
        const newValue = changes.apiKey.newValue;
        cachedApiKey =
            typeof newValue === 'string' && newValue.trim().length > 0
                ? newValue.trim()
                : null;
    }
});

/**
 * Fetch options from browser.storage.local, defaulting each option
 * based on its input type from shared/extensionOptions.ts
 */
export async function getExtensionOptions(): Promise<ExtensionOptionsState> {
    const defaults: Record<string, boolean | string> = {};
    for (const [optionId, option] of Object.entries(extensionOptions)) {
        defaults[optionId] = option.type === 'checkbox' ? false : '';
    }

    const storedOptions = await browser.storage.local.get(defaults);
    return storedOptions as ExtensionOptionsState;
}

/**
 * Return the stored BattleMetrics API key, trimmed, or null if not set.
 * The value is cached after first read to avoid repeated storage access.
 */
export async function getApiKey(): Promise<string | null> {
    if (cachedApiKey === undefined) {
        const options = await getExtensionOptions();
        const apiKey = options.apiKey;
        cachedApiKey = apiKey.trim().length > 0 ? apiKey.trim() : null;
    }
    return cachedApiKey;
}

/**
 * True if a non-empty BattleMetrics API key is stored
 */
export async function isApiKeyConfigured(): Promise<boolean> {
    return (await getApiKey()) !== null;
}

/**
 * Generate the options form from shared/extensionOptions.ts
 */
export async function generateFormOptions(form: HTMLFormElement) {
    const formFragment = document.createDocumentFragment();
    const storedExtensionOptions = await getExtensionOptions();

    for (const optionId of Object.keys(extensionOptions) as Array<
        keyof ExtensionOptionsState
    >) {
        const option = extensionOptions[optionId];
        const optionWrapper = document.createElement('div');
        optionWrapper.className =
            option.type === 'checkbox' ? 'option-field' : 'api-key-field';

        const label = document.createElement('label');
        label.htmlFor = optionId;

        if (option.type === 'checkbox') {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = optionId;
            input.checked = storedExtensionOptions[optionId] === true;
            label.innerHTML = option.label;
            optionWrapper.append(input, label);
        } else {
            label.textContent = option.label;
            optionWrapper.appendChild(label);

            if (option.help) {
                const help = document.createElement('p');
                help.className = 'api-key-help';
                help.innerHTML = option.help;
                optionWrapper.appendChild(help);
            }

            const input = document.createElement('input');
            input.type = option.type;
            input.id = optionId;
            input.placeholder = option.placeholder ?? '';
            input.autocomplete = 'off';
            input.value =
                typeof storedExtensionOptions[optionId] === 'string'
                    ? storedExtensionOptions[optionId]
                    : '';

            if (option.type === 'password') {
                const inputRow = document.createElement('div');
                inputRow.className = 'api-key-input-row';

                const toggleButton = document.createElement('button');
                toggleButton.type = 'button';
                toggleButton.className = 'api-key-toggle-button';
                toggleButton.textContent = 'Show';
                toggleButton.addEventListener('click', () => {
                    const reveal = input.type === 'password';
                    input.type = reveal ? 'text' : 'password';
                    toggleButton.textContent = reveal ? 'Hide' : 'Show';
                });

                inputRow.append(input, toggleButton);
                optionWrapper.appendChild(inputRow);
            } else {
                optionWrapper.appendChild(input);
            }
        }

        formFragment.appendChild(optionWrapper);
    }

    form.appendChild(formFragment);
}

/**
 * Set version number from manifest.json
 */
export function setVersionNumber(elementId: string) {
    const manifestData = browser.runtime.getManifest();
    const version = manifestData.version;
    const versionElement = document.getElementById(elementId);
    if (versionElement) {
        versionElement.textContent = `v${version}`;
    }
}

// Handle options form change
export async function handleFormChange(event: Event) {
    const element = event.target as HTMLInputElement;
    const option =
        extensionOptions[element.id as keyof typeof extensionOptions];
    if (option === undefined) return;

    const value: boolean | string =
        option.type === 'checkbox' ? element.checked : element.value.trim();

    try {
        await browser.storage.local.set({ [element.id]: value });
        showSavedText();
    } catch (e) {
        showErrorText();
        console.error(
            `[BattleMetrics Hour Summary] Error saving extension options: ${e}`
        );
        console.error(e);
    }
}

// Show saved text with timeout on options page
function showSavedText() {
    const status = document.getElementById(
        'status-text'
    ) as HTMLParagraphElement;
    status.classList.remove('error-text');
    clearTimeout(statusTextTimeout);

    status.textContent = 'Saved settings, refresh page to take effect';

    statusTextTimeout = setTimeout(() => {
        status.textContent = '';
    }, 1500);
}

// Show error text with timeout on options page
function showErrorText() {
    const status = document.getElementById(
        'status-text'
    ) as HTMLParagraphElement;
    status.classList.add('error-text');

    clearTimeout(statusTextTimeout);

    status.textContent = 'Failed to save settings, try again';

    statusTextTimeout = setTimeout(() => {
        status.textContent = '';
    }, 1500);
}
