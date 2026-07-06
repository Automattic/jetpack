import { buildChartTheme } from '@visx/xychart';
import { useMemo } from 'react';
import { useGlobalChartsTheme } from '../providers';
import { resolveCssVariable } from '../utils';
import type { SeriesData } from '../types';

// visx applies grid, axis, and tick-label colors as SVG presentation attributes,
// where CSS var() cannot resolve. Resolve WPDS tokens to concrete values (or their
// fallbacks) before handing the theme to buildChartTheme.
const resolveColor = ( value?: string ): string | undefined =>
	value ? resolveCssVariable( value ) ?? value : value;

export const useXYChartTheme = ( data: SeriesData[] ) => {
	const theme = useGlobalChartsTheme();

	return useMemo( () => {
		const seriesColors = ( data ?? [] )
			.map( series => series.options?.stroke )
			.filter( ( color ): color is string => Boolean( color ) );

		return buildChartTheme( {
			...theme,
			colors: [ ...seriesColors, ...( theme.colors ?? [] ) ],
			backgroundColor: resolveColor( theme.backgroundColor ),
			gridStyles: theme.gridStyles && {
				...theme.gridStyles,
				stroke: resolveColor( theme.gridStyles.stroke ),
			},
			xAxisLineStyles: theme.xAxisLineStyles && {
				...theme.xAxisLineStyles,
				stroke: resolveColor( theme.xAxisLineStyles.stroke ),
			},
			xTickLineStyles: theme.xTickLineStyles && {
				...theme.xTickLineStyles,
				stroke: resolveColor( theme.xTickLineStyles.stroke ),
			},
			svgLabelSmall: theme.svgLabelSmall && {
				...theme.svgLabelSmall,
				fill: resolveColor( theme.svgLabelSmall.fill ),
			},
		} );
	}, [ theme, data ] );
};
