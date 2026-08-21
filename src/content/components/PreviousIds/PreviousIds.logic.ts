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
        const filter = previousIDSearchInput.value.toLowerCase();
        let visibleCount = 0;

        for (let i = 0; i < previousIds.length; i++) {
            const item = previousIds[i];
            const nameEl = item.getElementsByTagName('b')[0];
            const textValue = (
                nameEl?.textContent ||
                nameEl?.innerText ||
                ''
            ).toLowerCase();
            const matches = textValue.includes(filter);
            item.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        }

        prevIdCount.innerText =
            previousIDSearchInput.value === ''
                ? `${previousIds.length}`
                : `${visibleCount} / ${previousIds.length}`;
    };

    // Add oninput listener with 200ms debounce
    const debouncedPreviousIDInput = debounce(filterPreviousIds, 200);
    previousIDSearchInput.oninput = debouncedPreviousIDInput;
}
