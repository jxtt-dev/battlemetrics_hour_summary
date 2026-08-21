import {
    setVersionNumber,
    handleFormChange,
    generateFormOptions,
} from './utils/extensionOptionHelpers';

document.addEventListener('DOMContentLoaded', async () => {
    setVersionNumber('version-number');

    // Generate extension options form from shared/extensionOptions.ts
    const form = document.getElementById('options-form') as HTMLFormElement;
    await generateFormOptions(form);

    form.addEventListener(
        'change',
        async (event) => await handleFormChange(event)
    );
});
