import { debounce } from '../../../utils/helpers';

/**
 * Set up event listener for previous ids toggle
 */
export function prepPrevIdsToggle(): void {
    const prevIdCheckbox = document.getElementById(
        'bmhs-prev-ids-show-more'
    ) as HTMLInputElement;
    const prevIdDiv = document.getElementById('bmhs-ids-div');
    if (prevIdCheckbox === null || prevIdDiv === null) {
        throw new Error('Previous IDs HTML is malformed');
    }

    prevIdCheckbox.addEventListener('change', () => {
        prevIdDiv.classList.toggle('bmhs-ids-show-more');
        const showMoreLabel = document.querySelector(
            'label[for="bmhs-prev-ids-show-more"]'
        );
        if (showMoreLabel === null) {
            throw new Error('Previous IDs HTML is malformed');
        }
        showMoreLabel.innerHTML = prevIdCheckbox.checked
            ? 'Hide previous identifiers'
            : 'Show previous identifiers';
    });
}

/**
 * Set up event listener for previous id search
 */
export function addPrevIdSearchListener(): void {
    const previousIDSearchInput = document.getElementById(
        'bmhs-prev-id-search'
    ) as HTMLInputElement;
    const previousIdsParentDiv = document.getElementById('bmhs-ids-div');
    if (previousIDSearchInput === null || previousIdsParentDiv === null) {
        throw new Error('Previous IDs HTML is malformed');
    }

    const previousIds = previousIdsParentDiv.getElementsByClassName(
        'bmhs-prev-id'
    ) as HTMLCollectionOf<HTMLElement>;
    const prevIdCount = document.getElementById('bmhs-prev-id-count');
    if (previousIds.length === 0 || prevIdCount === null) {
        throw new Error('Previous IDs HTML is malformed');
    }

    // Filter previous ids by search value
    const filterPreviousIds = () => {
        const inputValue = previousIDSearchInput.value;
        const filter = inputValue.toLowerCase();

        // Hide ids that don't match search term
        const visibleIds = [];
        const hiddenIds = [];

        for (let i = 0; i < previousIds.length; i++) {
            const previousIdName = previousIds[i].getElementsByTagName('b')[0];
            const textValue =
                previousIdName.textContent || previousIdName.innerText;
            const matchesFilter = textValue.toLowerCase().includes(filter);

            if (matchesFilter) {
                visibleIds.push(i);
            } else {
                hiddenIds.push(i);
            }
        }

        // Set matched identifier count
        if (previousIDSearchInput.value === '') {
            prevIdCount.innerText = `${previousIds.length}`;
        } else {
            prevIdCount.innerText = `${visibleIds.length} / ${previousIds.length}`;
        }

        // Apply layout changes separately to prevent forced reflow violations
        for (const i of visibleIds) {
            previousIds[i].style.display = '';
        }
        for (const i of hiddenIds) {
            previousIds[i].style.display = 'none';
        }
    };

    // Add oninput listener with 200ms debounce
    const debouncedPreviousIDInput = debounce(filterPreviousIds, 200);
    previousIDSearchInput.oninput = debouncedPreviousIDInput;
}
