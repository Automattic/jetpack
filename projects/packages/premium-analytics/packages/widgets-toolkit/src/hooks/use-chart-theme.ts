/**
 * External dependencies
 */
import { useMemo } from 'react';
import { WOO_COLORS } from '../constants';
import { useColorPreference } from './use-color-preference';
import type { ChartTheme } from '@automattic/charts';

/**
 * Internal dependencies
 */

/**
 * Extended chart theme with analytics-specific properties.
 * Extends the base ChartTheme from @automattic/charts.
 */
export type WooChartTheme = ChartTheme & {
	leaderboardChart: ChartTheme[ 'leaderboardChart' ] & {
		barBorderRadius: string;
	};
};

export function useChartTheme(): WooChartTheme {
	const { preferences } = useColorPreference();

	return useMemo( () => {
		// If the user is using a custom color theme, use colors generated from the design system accent
		// color token, otherwise use the default analytics theme colors.
		const colors =
			preferences.interfaceTheme === 'custom'
				? [ '--wpds-color-foreground-interactive-brand' ]
				: WOO_COLORS;

		return {
			backgroundColor: 'var(--wpds-color-background-surface-neutral-strong)',
			labelBackgroundColor: 'var(--wpds-color-background-interactive-neutral-weak)',
			labelTextColor: 'var(--wpds-color-foreground-interactive-neutral-strong)',
			colors,
			gridStyles: {
				stroke: 'var(--wpds-color-stroke-surface-neutral)',
				strokeWidth: 1,
			},
			tickLength: 4,
			gridColor: '',
			gridColorDark: '',
			svgLabelSmall: {
				fill: 'var(--wpds-color-foreground-content-neutral-weak)',
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
					'var(--wpds-color-stroke-surface-error-strong, #cc1818)',
					'var(--wpds-color-foreground-content-neutral-weak, #707070)',
					'var(--wpds-color-stroke-surface-success-strong, #008030)',
				] as [ string, string, string ], // [ negative, neutral, positive ]
			},
			conversionFunnelChart: {
				backgroundColor: 'var(--wpds-color-background-surface-brand)',
				positiveChangeColor: 'var(--wpds-color-foreground-content-success-weak, #008030)',
				negativeChangeColor: 'var(--wpds-color-foreground-content-error-weak, #cc1818)',
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
	}, [ preferences.interfaceTheme ] );
}
