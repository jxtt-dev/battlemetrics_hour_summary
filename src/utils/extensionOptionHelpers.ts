import browser from 'webextension-polyfill';
import { extensionOptions } from '../shared/extensionOptions';

let statusTextTimeout: number | undefined;

/**
 * Fetch options from browser.storage.sync
 *
 * Options default to false
 */
export async function getExtensionOptions(): Promise<Record<string, unknown>> {
    // Get default options using ids defined in shared/extensionOptions.ts
    const defaultOptions = Object.keys(extensionOptions).reduce((acc, key) => {
        acc[key] = false;
        return acc;
    }, {} as Record<string, boolean>);
    const storedOptions = await browser.storage.sync.get(defaultOptions);

    return storedOptions;
}

/**
 * Generate form options from shared/extensionOptions.ts
 */
export async function generateFormOptions(form: HTMLFormElement) {
    const formFragment = document.createDocumentFragment();
    const storedExtensionOptions = await getExtensionOptions();

    Object.entries(extensionOptions).forEach(([optionId, optionInnerHTML]) => {
        const optionWrapper = document.createElement('div');
        optionWrapper.className = 'option-field';
        optionWrapper.innerHTML = `
            <input
                type="checkbox"
                id="${optionId}"
                ${storedExtensionOptions[optionId] ? 'checked="checked"' : ''}
            />
            <label for="${optionId}">
                ${optionInnerHTML}
            </label>
        `;
        formFragment.appendChild(optionWrapper);
    });

    form.appendChild(formFragment);
}

/**
 * Set version number from manifest.json
 */
export function setVersionNumber() {
    const manifestData = browser.runtime.getManifest();
    const version = manifestData.version;
    const versionElement = document.getElementById('version-number');
    if (versionElement) {
        versionElement.textContent = `v${version}`;
    }
}

// Handle options form change
export async function handleFormChange(event: Event) {
    const element = event.target as HTMLInputElement;

    if (element.type === 'checkbox') {
        const settingId = element.id; // Generated in camelCase
        const isChecked = element.checked;

        // Save setting in browser storage
        try {
            await browser.storage.sync.set({ [settingId]: isChecked });
            showSavedText();
        } catch (e) {
            showErrorText();
            console.error(
                `[BattleMetrics Hour Summary] Error saving extension options: ${e}`
            );
            console.error(e);
        }
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

// Show saved text with timeout on options page
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
