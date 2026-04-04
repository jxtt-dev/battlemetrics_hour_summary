// @ts-nocheck
import * as Chartist from 'chartist';
import 'chartist/dist/chartist.min.css';

import { getPastUTCDatesReversed } from '../../../utils/helpers';

import './BarGraph.css';

export function renderPlaytimeBarGraph(
    targetDiv: HTMLDivElement,
    numberOfDays: number,
    data: number[]
) {
    // Dynamically size chart
    const CHART_WIDTH_PER_DAY = 10;
    const CHART_MIN_WIDTH = 650;
    const chartWidth = Math.max(
        CHART_MIN_WIDTH,
        numberOfDays * CHART_WIDTH_PER_DAY
    );

    const chartistConfig = {
        classNames: {
            chart: 'ct-chart-bar bmhs-playtime-graph',
        },
        width: `${chartWidth}px`,
        height: '150px',
        chartPadding: {
            left: -10,
            bottom: 20,
        },
        axisX: {
            labelInterpolationFnc: (_, index: number) =>
                axisXInterpolationFunction(index, numberOfDays),
            offset: 5,
            labelOffset: {
                x: 0,
                y: -4,
            },
        },
        axisY: {
            type: Chartist.FixedScaleAxis,
            ticks: [0, 6, 12, 18, 24],
            low: 0,
            high: 24,
            labelInterpolationFnc: (value: number, _) => `${value}hrs`,
        },
        plugins: [ChartistTooltip()],
    };

    const chartLabels = getPastUTCDatesReversed(numberOfDays);
    const dailySessionData = {
        labels: chartLabels,
        series: [data],
    };

    const chart = new Chartist.Bar(targetDiv, dailySessionData, chartistConfig);
}

function axisXInterpolationFunction(
    index: number,
    numberOfDays: number
): string | null {
    const daysAgo = numberOfDays - index - 1;

    if (daysAgo === 0) return 'Today';
    if (daysAgo % 7 !== 0) return null;

    // Monthly label every 28 days
    if (daysAgo >= 28 && daysAgo % 28 === 0) {
        return `${daysAgo / 28} month${daysAgo > 28 ? 's' : ''} ago`;
    }

    // Weekly labels under 28 days
    if (daysAgo > 0 && daysAgo < 28 && daysAgo % 7 === 0) {
        const weeks = daysAgo / 7;
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }

    return null;
}

// Reusable date formatter
const barChartDateFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
});

// Tooltip plugin for Chartist
function ChartistTooltip() {
    const options = {
        offset: { x: 12, y: -10 },
        minInteractionHeight: 10, // The minimum height for hover hitbox in pixels
    };

    const formatValue = (value: any) => parseFloat(value).toFixed(1);
    const formatLabel = (label: any) => barChartDateFormatter.format(label);

    return function (chart: any) {
        if (!(chart instanceof Chartist.Bar)) return;

        let tooltip: HTMLDivElement;

        function showTooltip(x: number, y: number, label: any, value: any) {
            const formattedValue = formatValue(value);
            const formattedLabel = formatLabel(label);
            tooltip.innerHTML = `${formattedValue} hours played on ${formattedLabel}`;
            tooltip.style.left = x + options.offset.x + 'px';
            tooltip.style.top = y + options.offset.y + 'px';
            tooltip.classList.add('bmhs-ct-tooltip--show');
        }

        function hideTooltip() {
            tooltip.classList.remove('bmhs-ct-tooltip--show');
        }

        function nudgeIntoViewport() {
            let rect = tooltip.getBoundingClientRect();
            let vw = window.innerWidth,
                vh = window.innerHeight;
            if (rect.right > vw - 8)
                tooltip.style.left =
                    parseFloat(tooltip.style.left) -
                    (rect.right - vw + 8) +
                    'px';
            if (rect.bottom > vh - 8)
                tooltip.style.top =
                    parseFloat(tooltip.style.top) -
                    (rect.bottom - vh + 8) +
                    'px';
        }

        chart.on('created', function () {
            const existingTooltips =
                document.getElementsByClassName('bmhs-ct-tooltip');
            while (existingTooltips.length > 0) {
                existingTooltips[0].remove();
            }

            tooltip = document.createElement('div');
            tooltip.className = 'bmhs-ct-tooltip';
            document.body.appendChild(tooltip);

            const bars = chart.container.querySelectorAll('.ct-bar');
            const labels = chart.data.labels || [];

            bars.forEach(function (bar: any) {
                const seriesEl = bar.closest('.ct-series');
                const seriesIdx = Array.from(
                    chart.container.querySelectorAll('.ct-series')
                ).indexOf(seriesEl);
                const barIdx = Array.from(
                    seriesEl.querySelectorAll('.ct-bar')
                ).indexOf(bar);

                const value =
                    chart.data.series[seriesIdx] &&
                    chart.data.series[seriesIdx][barIdx] !== undefined
                        ? chart.data.series[seriesIdx][barIdx]
                        : bar.getAttribute('ct:value');
                const label =
                    labels[barIdx] !== undefined ? labels[barIdx] : barIdx;

                // Calculate height of bar for hitbox
                const y1 = parseFloat(bar.getAttribute('y1'));
                const y2 = parseFloat(bar.getAttribute('y2'));
                const barHeight = Math.abs(y1 - y2);

                let interactionTarget = bar;

                // If bar is smaller than minInteractionHeight, create a proxy hitbox
                if (
                    barHeight !== 0 &&
                    barHeight < options.minInteractionHeight
                ) {
                    const hitArea = document.createElementNS(
                        'http://www.w3.org/2000/svg',
                        'line'
                    );
                    const barWidth = window.getComputedStyle(bar).strokeWidth;

                    hitArea.setAttribute('x1', bar.getAttribute('x1'));
                    hitArea.setAttribute('x2', bar.getAttribute('x2'));

                    hitArea.setAttribute('y1', `${y1}`);
                    hitArea.setAttribute(
                        'y2',
                        `${y1 - options.minInteractionHeight}`
                    );

                    hitArea.style.stroke = 'rgba(0,0,0,0)';
                    hitArea.style.strokeWidth = barWidth;
                    hitArea.style.cursor = 'default';
                    hitArea.style.pointerEvents = 'all';

                    bar.parentNode.appendChild(hitArea);
                    interactionTarget = hitArea;
                }

                interactionTarget.addEventListener(
                    'mouseenter',
                    function (e: any) {
                        showTooltip(e.clientX, e.clientY, label, value);
                        nudgeIntoViewport();
                    }
                );
                interactionTarget.addEventListener(
                    'mousemove',
                    function (e: any) {
                        tooltip.style.left =
                            e.clientX + options.offset.x + 'px';
                        tooltip.style.top = e.clientY + options.offset.y + 'px';
                        nudgeIntoViewport();
                    }
                );
                interactionTarget.addEventListener('mouseleave', hideTooltip);
            });
        });

        chart.on('detach', function () {
            if (tooltip) tooltip.remove();
        });
    };
}
