import browser from 'webextension-polyfill';
import {
    setVersionNumber,
    handleFormChange,
    generateFormOptions,
    getExtensionOptions,
} from './utils/extensionOptionHelpers';

document.addEventListener('DOMContentLoaded', async () => {
    setVersionNumber();

    // Generate extension options form from shared/extensionOptions.ts
    const form = document.getElementById('options-form') as HTMLFormElement;
    generateFormOptions(form);

    // Load settings from browser storage
    const data = await getExtensionOptions();
    Object.keys(data).forEach((key) => {
        const input = form.querySelector(
            `input[id="${key}"]`
        ) as HTMLInputElement;
        if (input) input.checked = data[key] as boolean;
    });

    form.addEventListener(
        'change',
        async (event) => await handleFormChange(event)
    );

    // Setup settings link
    const optionsLink = document.getElementById(
        'open-options'
    ) as HTMLLinkElement;
    optionsLink.addEventListener('click', (event) => {
        event.preventDefault();
        browser.runtime
            .openOptionsPage()
            .catch((err) =>
                console.error(
                    '[BattleMetrics Hour Summary] Error opening options page:', err
                )
            );
    });
});
