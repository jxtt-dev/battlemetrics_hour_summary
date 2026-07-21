import browser from 'webextension-polyfill';
import { extensionOptions } from '../shared/extensionOptions';
import { BM_API_TOKEN_PAGE_URL } from '../shared/constants';
import { getApiKey, setApiKey } from './apiKey';

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
 * Build the BattleMetrics API token field and wire up saving
 *
 * The BattleMetrics API requires a token, so this field is mandatory for the
 * summary to render.
 */
export async function generateApiKeyField(container: HTMLElement) {
    container.innerHTML = `
        <label class="api-key-label" for="api-key-input">
            BattleMetrics API token
        </label>
        <div class="api-key-row">
            <input
                type="password"
                id="api-key-input"
                autocomplete="off"
                spellcheck="false"
                placeholder="Paste your token"
            />
            <button type="button" id="api-key-toggle" title="Show token">
                Show
            </button>
            <button type="button" id="api-key-save">Save</button>
        </div>
        <p class="api-key-hint">
            Required since BattleMetrics made their API token only. Create one
            at
            <a href="${BM_API_TOKEN_PAGE_URL}" target="_blank" rel="noopener noreferrer">
                battlemetrics.com/developers
            </a>.
        </p>
    `;

    const input = container.querySelector('#api-key-input') as HTMLInputElement;
    const toggle = container.querySelector(
        '#api-key-toggle'
    ) as HTMLButtonElement;
    const save = container.querySelector('#api-key-save') as HTMLButtonElement;

    input.value = await getApiKey();

    toggle.addEventListener('click', () => {
        const hidden = input.type === 'password';
        input.type = hidden ? 'text' : 'password';
        toggle.textContent = hidden ? 'Hide' : 'Show';
        toggle.title = hidden ? 'Hide token' : 'Show token';
    });

    save.addEventListener('click', async () => {
        try {
            await setApiKey(input.value);
            showStatusText(
                input.value.trim() === ''
                    ? 'Removed API token'
                    : 'Saved API token, refresh page to take effect'
            );
        } catch (e) {
            showErrorText('Failed to save API token, try again');
            console.error(
                `[BattleMetrics Hour Summary] Error saving API token: ${e}`
            );
        }
    });

    // Enter in the field saves too
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            save.click();
        }
    });
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
            showStatusText('Saved settings, refresh page to take effect');
        } catch (e) {
            showErrorText('Failed to save settings, try again');
            console.error(
                `[BattleMetrics Hour Summary] Error saving extension options: ${e}`
            );
            console.error(e);
        }
    }
}

// Show status text with timeout on options page
function showStatusText(text: string) {
    const status = document.getElementById(
        'status-text'
    ) as HTMLParagraphElement;
    status.classList.remove('error-text');
    clearTimeout(statusTextTimeout);

    status.textContent = text;

    statusTextTimeout = setTimeout(() => {
        status.textContent = '';
    }, 2500);
}

// Show error text with timeout on options page
function showErrorText(text: string) {
    const status = document.getElementById(
        'status-text'
    ) as HTMLParagraphElement;
    status.classList.add('error-text');

    clearTimeout(statusTextTimeout);

    status.textContent = text;

    statusTextTimeout = setTimeout(() => {
        status.textContent = '';
    }, 2500);
}
