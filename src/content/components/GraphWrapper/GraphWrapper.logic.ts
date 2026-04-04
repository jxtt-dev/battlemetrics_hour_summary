import { GLOBAL_STATE } from '../../services';
/**
 * Adds event listener to "Show Graph" button
 */
export function playtimeGraphVisibilityListener(
    playtimeGraphVisibilityButton: HTMLButtonElement,
    gameId: string
): void {
    const buttonState =
        playtimeGraphVisibilityButton.getAttribute('aria-pressed') === 'true';
    playtimeGraphVisibilityButton.setAttribute(
        'aria-pressed',
        `${!buttonState}`
    );

    // Toggle playtime graph visibility
    const playtimeGraphScrollWrapper = document.getElementById(
        `${gameId}-playtime-graph-scroll-wrapper`
    ) as HTMLDivElement;
    if (buttonState) {
        playtimeGraphScrollWrapper.style.display = 'none';
        playtimeGraphVisibilityButton.innerText = 'Show graph';
    } else {
        playtimeGraphScrollWrapper.style.display = 'block';
        playtimeGraphVisibilityButton.innerText = 'Hide graph';
    }
}

export function toggleGraphTypeListener(event: Event, gameId: string): void {
    const barGraphWrapper = document.getElementById(
        `${gameId}-playtime-bar-graph-wrapper`
    ) as HTMLDivElement;
    const heatmapGraphWrapper = document.getElementById(
        `${gameId}-playtime-heatmap-graph-wrapper`
    ) as HTMLDivElement;

    // Checked = heatmap
    if ((event.target as HTMLInputElement).checked) {
        GLOBAL_STATE.graphType = true;
        barGraphWrapper.style.display = 'none';
        heatmapGraphWrapper.style.display = 'block';
    }
    // Unchecked = bar graph
    else {
        GLOBAL_STATE.graphType = false;
        barGraphWrapper.style.display = 'block';
        heatmapGraphWrapper.style.display = 'none';
    }
}
