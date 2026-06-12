/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { CHART_COLORS } from '../constants';
import { useColorPreference } from './use-color-preference';
import type { ChartTheme } from '@automattic/charts';

/**
 * Extended chart theme with leaderboard-specific properties.
 * Extends the base ChartTheme from @automattic/charts.
 */
export type AnalyticsChartTheme = ChartTheme & {
	leaderboardChart: ChartTheme[ 'leaderboardChart' ] & {
		barBorderRadius: string;
	};
};

export function useChartTheme(): AnalyticsChartTheme {
	const { preferences } = useColorPreference();

	return useMemo( () => {
		// If the user is using a custom color theme, use colors generated from the design system accent
		// color token, otherwise use the default chart palette.
		const colors =
			preferences.interfaceTheme === 'custom'
				? [ 'var(--wpds-color-fg-interactive-brand)' ]
				: CHART_COLORS;

		return {
			backgroundColor: 'var(--wpds-color-bg-surface-neutral-strong)',
			labelBackgroundColor: 'var(--wpds-color-bg-interactive-neutral-weak)',
			labelTextColor: 'var(--wpds-color-fg-interactive-neutral-strong)',
			colors,
			gridStyles: {
				stroke: 'var(--wpds-color-stroke-surface-neutral)',
				strokeWidth: 1,
			},
			tickLength: 4,
			gridColor: '',
			gridColorDark: '',
			svgLabelSmall: {
				fill: 'var(--wpds-color-fg-content-neutral-weak)',
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
					color: 'var(--wpds-color-fg-content-neutral)',
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
				labelSpacing: 1.5,
				barBorderRadius: 'var(--wpds-border-radius-md)',
				deltaColors: [
					'var(--wpds-color-fg-content-error-weak)',
					'var(--wpds-color-fg-content-neutral)',
					'var(--wpds-color-fg-content-success-weak)',
				] as [ string, string, string ], // [ negative, neutral, positive ]
			},
			conversionFunnelChart: {
				backgroundColor: 'var(--wpds-color-bg-surface-brand)',
				positiveChangeColor: 'var(--wpds-color-fg-content-success-weak)',
				negativeChangeColor: 'var(--wpds-color-fg-content-error-weak)',
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
					strokeWidth: 2,
					strokeDasharray: '4 4',
				},
			],
		};
	}, [ preferences.interfaceTheme ] );
}
