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
});
