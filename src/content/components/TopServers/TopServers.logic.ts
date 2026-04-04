export function showMoreButtonEventListener(
    checkbox: HTMLInputElement,
    showMoreLabel: HTMLLabelElement,
    topServersList: HTMLOListElement
): void {
    topServersList.classList.toggle('bmhs-show-rest');
    showMoreLabel.innerHTML = checkbox.checked
        ? 'Show less...'
        : 'Show more...';
}
