import { buildChartTheme } from '@visx/xychart';
import { useMemo } from 'react';
import { useGlobalChartsTheme } from '../providers';
import { createCssVariableResolver } from '../utils';
import type { SeriesData } from '../types';

export const useXYChartTheme = ( data: SeriesData[] ) => {
	const theme = useGlobalChartsTheme();

	return useMemo( () => {
		// visx applies grid, axis, and tick-label colours as SVG presentation attributes, where CSS var() cannot resolve. Resolve them to concrete values before handing the theme to buildChartTheme.
		//
		// One resolver per theme build, so the five roles below share a single getComputedStyle call rather than taking one each.
		const resolve = createCssVariableResolver();
		const resolveColor = ( value?: string ): string | undefined =>
			value ? resolve( value ) ?? value : value;

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
