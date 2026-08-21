import { periodPlaytimeEventListener } from './PeriodPlaytime.logic';

import './PeriodPlaytime.css';

/**
 * Generate display and selector for playtime in a given period, for a game
 *
 * @returns HTMLDivElement with label and selector
 */
export function generatePeriodPlaytime(
    gameId: string,
    hasApiKey = false
): HTMLDivElement {
    // Period playtime wrapper
    const pastWeeksHoursWrapper = document.createElement('div');
    pastWeeksHoursWrapper.className = 'bmhs-past-weeks-hours-wrapper';
    pastWeeksHoursWrapper.id = `bmhs-${gameId}-past-weeks-hours-wrapper`;

    // Hour display and selector
    const pastWeeksHoursDiv = document.createElement('div');
    pastWeeksHoursDiv.id = `${gameId}-past-weeks-hours`;
    pastWeeksHoursDiv.className = hasApiKey
        ? 'bmhs-past-weeks-hours'
        : 'bmhs-past-weeks-hours bmhs-disabled';

    if (!hasApiKey) {
        pastWeeksHoursDiv.title =
            'Viewing playtime for a specific period requires a BattleMetrics API key. View the options page for more information.';
    }

    // Option value is number of days
    pastWeeksHoursDiv.innerHTML = `
        <label for="${gameId}-timeframe-selector">— hours past</label>
        <select
            id="${gameId}-timeframe-selector"
            name="${gameId}-timeframe-selector"
            title="Select time frame"
            ${hasApiKey ? 'required' : 'disabled'}
        >
            <option value="" disabled selected class="bmhs-past-weeks-hours-option">
                Select
            </option>
            <option value="14" class="bmhs-past-weeks-hours-option">
                2 weeks
            </option>
            <option value="28" class="bmhs-past-weeks-hours-option">
                1 month
            </option>
            <option value="84" class="bmhs-past-weeks-hours-option">
                3 months
            </option>
            <option value="168" class="bmhs-past-weeks-hours-option">
                6 months
            </option>
            <option value="364" class="bmhs-past-weeks-hours-option">
                1 year
            </option>
        </select>
        <i>(estimated)</i>
    `;

    pastWeeksHoursWrapper.appendChild(pastWeeksHoursDiv);

    if (hasApiKey) {
        // Add event listener to selector
        const timeframeSelector = pastWeeksHoursDiv.querySelector(
            `#${gameId}-timeframe-selector`
        ) as HTMLSelectElement;
        const timeframeLabel = pastWeeksHoursDiv.querySelector(
            `label[for=${gameId}-timeframe-selector]`
        ) as HTMLLabelElement;

        // Calculates and renders playtime in timeframe
        // Also triggers bar/heatmap graph generation
        timeframeSelector.addEventListener('change', async (event: Event) => {
            const numberOfDays = parseInt(
                (event!.target as HTMLSelectElement).value
            );
            periodPlaytimeEventListener(numberOfDays, gameId, timeframeLabel);
        });
    }

    return pastWeeksHoursWrapper;
}
