import { getPastUTCDatesReversed } from '../../../utils/helpers';

import './HeatmapGraph.css';

export function renderPlaytimeHeatmapGraph(
    targetDiv: HTMLDivElement,
    numberOfDays: number,
    data: number[]
) {
    // Template for heatmap
    const heatmapTemplate = document.createElement('template');
    heatmapTemplate.innerHTML = `
        <div class="bmhs-heatmap-wrapper">
            <div class="bmhs-heatmap-y-axis" id="bmhs-heatmap-yAxis"></div>
            <div>
                <div class="bmhs-heatmap-grid" id="bmhs-heatmap-grid"></div>
                <div class="bmhs-heatmap-months" id="bmhs-heatmap-months"></div>
            </div>
        </div>
        <div id="bmhs-heatmap-tooltip" class="bmhs-heatmap-tooltip"></div>
    `;

    const heatmapWrapper = heatmapTemplate.content;

    const dateLabels = getPastUTCDatesReversed(numberOfDays);

    // Populate template
    generateHeatmap(heatmapWrapper, dateLabels, data);

    // Insert into targetDiv
    targetDiv.appendChild(heatmapWrapper);
}

function getHeatmapColorClass(value: number, maxValue: number) {
    if (value === 0 || maxValue === 0) return 'bmhs-heatmap-color-0';
    const ratio = value / maxValue;
    if (ratio < 0.2) return 'bmhs-heatmap-color-1';
    if (ratio < 0.4) return 'bmhs-heatmap-color-2';
    if (ratio < 0.6) return 'bmhs-heatmap-color-3';
    if (ratio < 0.8) return 'bmhs-heatmap-color-4';
    return 'bmhs-heatmap-color-5';
}

// Reusable date formatter
const heatmapDateFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
});

// Data: hour value (0-24)
function generateHeatmap(
    heatmapWrapper: DocumentFragment,
    dates: Date[],
    data: number[]
) {
    const tooltipOptions = { offset: { x: 10, y: 10 } };

    const grid = heatmapWrapper.getElementById(
        'bmhs-heatmap-grid'
    ) as HTMLDivElement;
    const monthsDiv = heatmapWrapper.getElementById(
        'bmhs-heatmap-months'
    ) as HTMLDivElement;
    const yAxis = heatmapWrapper.getElementById(
        'bmhs-heatmap-yAxis'
    ) as HTMLDivElement;
    const tooltip = heatmapWrapper.getElementById(
        'bmhs-heatmap-tooltip'
    ) as HTMLDivElement;

    const maxValue = Math.max(...data, 0);
    const formatValue = (value: number) => value.toFixed(1);
    const formatLabel = (label: Date) => heatmapDateFormatter.format(label);

    // Label and value are preformatted
    function showTooltip(x: number, y: number, label: string, value: string) {
        tooltip.innerHTML = `${value} hours played on ${label}`;
        tooltip.style.left = x + tooltipOptions.offset.x + 'px';
        tooltip.style.top = y + tooltipOptions.offset.y + 'px';
        tooltip.classList.add('bmhs-heatmap-tooltip--show');
    }

    function hideTooltip() {
        tooltip.classList.remove('bmhs-heatmap-tooltip--show');
    }

    // Clear existing heatmap
    grid.innerHTML = '';
    monthsDiv.innerHTML = '';
    yAxis.innerHTML = '';

    // Y axis labels
    const yAxisLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    yAxisLabels.forEach((day, _) => {
        const div = document.createElement('div');
        if (day === 'Mon' || day === 'Wed' || day === 'Fri') {
            div.textContent = day;
        }
        yAxis.appendChild(div);
    });

    // Align to Sunday start using UTC
    const firstDay = dates[0]?.getUTCDay() ?? 0; // 0 = Sunday
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'bmhs-heatmap-cell';
        emptyCell.style.visibility = 'hidden';
        grid.appendChild(emptyCell);
    }

    // Build grid using document fragment
    const gridFragment = document.createDocumentFragment();
    dates.forEach((dateTime, i) => {
        const cell = document.createElement('div');
        cell.className = 'bmhs-heatmap-cell';

        const value = data[i] ?? 0;
        cell.classList.add(getHeatmapColorClass(value, maxValue));

        // Store preformatted data on element
        cell.dataset.value = formatValue(value);
        cell.dataset.label = formatLabel(dateTime);

        gridFragment.appendChild(cell);
    });
    grid.appendChild(gridFragment);

    // X axis labels (months)
    const monthsFragment = document.createDocumentFragment();
    let lastMonth = -1;
    dates.forEach((date, i) => {
        const month = date.getUTCMonth();
        if (month !== lastMonth) {
            const div = document.createElement('div');
            div.textContent = date.toLocaleString('default', {
                month: 'short',
                timeZone: 'UTC',
            });
            monthsFragment.appendChild(div);
            lastMonth = month;
        } else {
            const spacer = document.createElement('div');
            monthsFragment.appendChild(spacer);
        }
    });
    monthsDiv.appendChild(monthsFragment);

    // Event listeners for tooltip
    grid.addEventListener('mousemove', (e) => {
        const cell = (e.target as HTMLDivElement)!.closest(
            '.bmhs-heatmap-cell'
        ) as HTMLDivElement;
        if (!cell || !cell.dataset.label || !cell.dataset.value) return;

        showTooltip(
            e.clientX,
            e.clientY,
            cell.dataset.label,
            cell.dataset.value
        );
    });
    grid.addEventListener('mouseleave', hideTooltip);
}
