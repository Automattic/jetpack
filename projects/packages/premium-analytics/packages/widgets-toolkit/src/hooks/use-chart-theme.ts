/**
 * External dependencies
 */
import { useMemo } from 'react';
import type { ChartTheme } from '@jetpack-premium-analytics/externals';

/**
 * The `@automattic/charts` theme plus the analytics-specific properties.
 */
export type WooChartTheme = ChartTheme & {
	leaderboardChart: ChartTheme[ 'leaderboardChart' ] & {
		barBorderRadius: string;
	};
};

export function useChartTheme(): WooChartTheme {
	return useMemo( () => {
		return {
			backgroundColor: 'var(--wpds-color-background-surface-neutral-strong)',
			labelBackgroundColor: 'var(--wpds-color-background-interactive-neutral-weak)',
			labelTextColor: 'var(--wpds-color-foreground-interactive-neutral-strong)',
			gridStyles: {
				stroke: 'var(--wpds-color-stroke-surface-neutral)',
				strokeWidth: 1,
			},
			tickLength: 4,
			gridColor: '',
			gridColorDark: '',
			// `fontSize` is load-bearing: it has to stay a plain number, since resolveFontSize()
			// rejects var(); without it visx falls back to 11 and the chart margin and pie label
			// measurements go with it. `fill` is not, any more — CHARTS-203 made the charts
			// default a single-level pointer that resolves on its own, so this only restates it.
			// Harmless, since the value publishes the theme layer and degrades rather than
			// breaking, but it goes with the color props in CHARTS-227.
			svgLabelSmall: {
				fill: 'var(--wpds-color-foreground-content-neutral)',
				fontSize: 12,
			},
			xTickLineStyles: { stroke: '' },
			xAxisLineStyles: {
				stroke: 'var(--wpds-color-stroke-surface-neutral)',
				strokeWidth: 1,
			},
			legend: {
				labelStyles: {
					fontSize: 'var(--wpds-typography-font-size-sm)',
					fontWeight: 400,
					color: 'var(--wpds-color-foreground-content-neutral)',
				},
				containerStyles: {
					rowGap: 'var( --wpds-dimension-padding-sm )',
					columnGap: 'var( --wpds-dimension-padding-sm )',
				},
				shapeStyles: [
					{
						transform: 'translate(0, 1px)',
					},
					{
						transform: 'translate(0, 1px)',
						strokeDasharray: '2, 2, 3, 2, 3, 2, 2',
					},
				],
			},
			leaderboardChart: {
				rowGap: 12,
				columnGap: 4,
				labelSpacing: 'xs',
				barBorderRadius: 'var(--wpds-border-radius-md)',
				deltaColors: [
					'var(--wpds-color-stroke-surface-error-strong)',
					'var(--wpds-color-foreground-content-neutral-weak)',
					'var(--wpds-color-stroke-surface-success-strong)',
				] as [ string, string, string ], // [ negative, neutral, positive ]
			},
			conversionFunnelChart: {
				backgroundColor: 'var(--wpds-color-background-surface-brand)',
				positiveChangeColor: 'var(--wpds-color-foreground-content-success-weak)',
				negativeChangeColor: 'var(--wpds-color-foreground-content-error-weak)',
			},
			lineChart: {
				lineStyles: {
					comparison: {
						strokeDasharray: '4 4',
						strokeWidth: 1.5,
						strokeLinecap: 'square' as const,
						strokeOpacity: 0.8,
						strokeDashoffset: 2,
					},
				},
			},
			seriesLineStyles: [
				{
					strokeWidth: 2,
				},
				{
					strokeDasharray: '4 4',
					strokeWidth: 1.5,
					strokeLinecap: 'square' as const,
					strokeDashoffset: 2,
				},
			],
		};
	}, [] );
}
