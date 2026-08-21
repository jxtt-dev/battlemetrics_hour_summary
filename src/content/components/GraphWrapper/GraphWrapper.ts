import { GLOBAL_STATE } from '../../services';
import {
    playtimeGraphVisibilityListener,
    toggleGraphTypeListener,
} from './GraphWrapper.logic';

import './GraphWrapper.css';

/**
 * Attaches graph buttons with event listener for timeframeSelector
 */
function addGraphButtons(
    pastWeeksHoursDivWrapper: HTMLDivElement,
    gameId: string
): void {
    // Show graph button and graph type selector
    // Hidden until timeframe is selected
    const playtimeGraphButtonWrapper = document.createElement('div');
    playtimeGraphButtonWrapper.className = 'bmhs-playtime-graph-button-group';
    playtimeGraphButtonWrapper.id = `bmhs-${gameId}-playtime-graph-button-group`;
    playtimeGraphButtonWrapper.style.display = 'none';

    playtimeGraphButtonWrapper.innerHTML = `
        <label class="bmhs-graph-type-toggle">
            <div class="bmhs-toggle-wrapper">
                <input
                    id="${gameId}-toggle-playtime-graph"
                    type="checkbox"
                    class="bmhs-graph-toggle-input"
                    aria-label="Toggle graph type"
                />
                <div class="bmhs-toggle-option-box" title="Bar Chart">
                    <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="bmhs-graph-toggle-bar-chart-icon" alt="Bar Chart"><path fill="currentColor" d="M16 20v-7h4v7zm-6 0V4h4v16zm-6 0V9h4v11z"/></svg>
                </div>
                <div
                    class="bmhs-toggle-option-box"
                    title="Calendar Heatmap"
                >
                    <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="bmhs-graph-toggle-calendar-icon" alt="Calendar Heatmap"><path fill="currentColor" d="M11 14v-2h2v2zm-4 0v-2h2v2zm8 0v-2h2v2zm-4 4v-2h2v2zm-4 0v-2h2v2zm8 0v-2h2v2zM3 22V4h3V2h2v2h8V2h2v2h3v18zm2-2h14V10H5z"/></svg>
                </div>
            </div>
        </label>
        <button id="${gameId}-playtime-graph-button" class="bmhs-playtime-graph-button" aria-pressed="false">
            Show graph
        </button>
    `;

    // Add buttons to pastWeeksHoursDivWrapper
    pastWeeksHoursDivWrapper.appendChild(playtimeGraphButtonWrapper);

    // Add event listener to timeframeSelector to enable graph buttons
    const timeframeSelector = pastWeeksHoursDivWrapper.querySelector(
        `#${gameId}-timeframe-selector`
    ) as HTMLSelectElement;
    timeframeSelector.addEventListener('change', () => {
        playtimeGraphButtonWrapper.style.display = 'inline-block';
    });

    // Add event listener to "Show graph" button
    const playtimeGraphVisibilityButton =
        playtimeGraphButtonWrapper.querySelector(
            `#${gameId}-playtime-graph-button`
        ) as HTMLButtonElement;
    playtimeGraphVisibilityButton.addEventListener('click', () =>
        playtimeGraphVisibilityListener(playtimeGraphVisibilityButton, gameId)
    );

    // Add event listener to graph type button
    const playtimeGraphTypeToggle = playtimeGraphButtonWrapper.querySelector(
        `#${gameId}-toggle-playtime-graph`
    ) as HTMLInputElement;
    playtimeGraphTypeToggle.addEventListener('change', (event) =>
        toggleGraphTypeListener(event, gameId)
    );
}

/**
 * Adds left and right scroll buttons to graph
 */
function addScrollButtons(
    scrollWrapper: HTMLElement,
    scrollContent: HTMLElement
): void {
    const SCROLL_AMOUNT = 200;
    const EDGE_ZONE = 60;

    const leftBtn = document.createElement('button');
    leftBtn.className = 'bmhs-scroll-btn bmhs-scroll-btn--left';
    leftBtn.innerHTML = '&#8249;';
    const rightBtn = document.createElement('button');
    rightBtn.className = 'bmhs-scroll-btn bmhs-scroll-btn--right';
    rightBtn.innerHTML = '&#8250;';

    scrollWrapper.appendChild(leftBtn);
    scrollWrapper.appendChild(rightBtn);

    // Track which edges the cursor is near
    let nearLeft = false;
    let nearRight = false;

    function atStart(): boolean {
        return scrollContent.scrollLeft <= 0;
    }
    function atEnd(): boolean {
        return (
            scrollContent.scrollLeft + scrollContent.clientWidth >=
            scrollContent.scrollWidth - 1
        );
    }

    function updateButtonVisibility(): void {
        leftBtn.classList.toggle(
            'bmhs-scroll-btn--visible',
            nearLeft && !atStart()
        );
        rightBtn.classList.toggle(
            'bmhs-scroll-btn--visible',
            nearRight && !atEnd()
        );
    }

    // Add event listeners
    leftBtn.addEventListener('click', () => {
        scrollContent.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', () => {
        scrollContent.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
    });
    scrollWrapper.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = scrollWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;

        nearLeft = x < EDGE_ZONE;
        nearRight = x > rect.width - EDGE_ZONE;

        updateButtonVisibility();
    });
    scrollWrapper.addEventListener('mouseleave', () => {
        nearLeft = false;
        nearRight = false;
        updateButtonVisibility();
    });
    scrollContent.addEventListener('scroll', () => {
        updateButtonVisibility();
    });
}

/**
 * Attaches graph buttons and graph wrapper to a game tab
 */
export function addGraphWrapper(
    tabContentDiv: HTMLDivElement,
    gameId: string
): void {
    if (tabContentDiv === null) {
        throw new Error('tabContentDiv is null');
    }

    // Add graph buttons
    const pastWeeksHoursDivWrapper = tabContentDiv.querySelector(
        `#bmhs-${gameId}-past-weeks-hours-wrapper`
    ) as HTMLDivElement;
    addGraphButtons(pastWeeksHoursDivWrapper, gameId);

    // Create graph scroll wrapper
    const playtimeGraphScrollWrapper = document.createElement('div');
    playtimeGraphScrollWrapper.className = 'bmhs-playtime-graph-scroll-wrapper';
    playtimeGraphScrollWrapper.id = `${gameId}-playtime-graph-scroll-wrapper`;
    playtimeGraphScrollWrapper.style.display = 'none';

    // Create wrapper for graph itself
    const playtimeGraphWrapper = document.createElement('div');
    playtimeGraphWrapper.className = 'bmhs-playtime-graph-wrapper';
    playtimeGraphWrapper.id = `${gameId}-playtime-graph-wrapper`;

    // Create wrappers for each graph type
    const barGraphWrapper = document.createElement('div');
    barGraphWrapper.id = `${gameId}-playtime-bar-graph-wrapper`;
    const heatmapGraphWrapper = document.createElement('div');
    heatmapGraphWrapper.id = `${gameId}-playtime-heatmap-graph-wrapper`;

    barGraphWrapper.style.display =
        GLOBAL_STATE.graphType === 'bar' ? 'block' : 'none';
    heatmapGraphWrapper.style.display =
        GLOBAL_STATE.graphType === 'heatmap' ? 'block' : 'none';

    playtimeGraphWrapper.appendChild(barGraphWrapper);
    playtimeGraphWrapper.appendChild(heatmapGraphWrapper);

    // Append wrapper to tabContentDiv
    playtimeGraphScrollWrapper.appendChild(playtimeGraphWrapper);
    addScrollButtons(playtimeGraphScrollWrapper, playtimeGraphWrapper);
    tabContentDiv.appendChild(playtimeGraphScrollWrapper);
}
