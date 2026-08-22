import browser from 'webextension-polyfill';
import {
    extensionOptions,
    ExtensionOptionsState,
} from '../shared/extensionOptions';

let statusTextTimeout: number | undefined;

/**
 * Fetch options from browser.storage.local, defaulting each option
 * based on its input type from shared/extensionOptions.ts
 */
export async function getExtensionOptions(): Promise<ExtensionOptionsState> {
    // Build storage defaults from the option definitions
    const defaults: Record<string, boolean | string> = {};
    for (const [optionId, option] of Object.entries(extensionOptions)) {
        defaults[optionId] = option.type === 'checkbox' ? false : '';
    }

    const storedOptions = await browser.storage.local.get(defaults);
    return storedOptions as ExtensionOptionsState;
}

/**
 * Generate the options form from shared/extensionOptions.ts
 */
export async function generateFormOptions(form: HTMLFormElement) {
    const formFragment = document.createDocumentFragment();
    const storedExtensionOptions = await getExtensionOptions();

    for (const optionId of Object.keys(
        extensionOptions
    ) as Array<keyof ExtensionOptionsState>) {
        const option = extensionOptions[optionId];
        const optionWrapper = document.createElement('div');
        optionWrapper.className = 'option-field';

        const label = document.createElement('label');
        label.htmlFor = optionId;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = optionId;
        input.checked = storedExtensionOptions[optionId] === true;
        label.innerHTML = option.label;
        optionWrapper.append(input, label);

        formFragment.appendChild(optionWrapper);
    }

    form.appendChild(formFragment);
}

/**
 * Set version number from manifest.json
 */
export function setVersionNumber(elementId: string = 'version-number') {
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
    const option = extensionOptions[element.id as keyof typeof extensionOptions];
    if (option === undefined) return;

    const value: boolean | string =
        option.type === 'checkbox' ? element.checked : element.value.trim();

    // Save setting in browser storage
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
