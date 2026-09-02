/**
 * External dependencies
 */
import { useMemo } from 'react';
import type { ChartTheme } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
// The dashboard's leaderboard spacing and bar radius. They are set in CSS, not on the theme below.
import './chart-roles.scss';

export function useChartTheme(): ChartTheme {
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
			// `fontSize` is load-bearing: it must stay a plain number, since resolveFontSize()
			// rejects var() — without it visx falls back to 11 and margin/pie-label sizing break.
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
				labelSpacing: 'xs',
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
