import { buildChartTheme } from '@visx/xychart';
import { useMemo } from 'react';
import { useGlobalChartsTheme } from '../providers';
import { useChartScopeElement } from '../providers/chart-scope';
import { createCssVariableResolver } from '../utils';
import type { SeriesData } from '../types';

export const useXYChartTheme = ( data: SeriesData[] ) => {
	const theme = useGlobalChartsTheme();
	const scopeElement = useChartScopeElement();

	// The only thing the theme takes from `data` is the series strokes, so key the memo on those rather than on the array's identity. A caller passing an inline literal — `<LineChart data={ [ … ] } />`, which the stories and several consumers do — otherwise rebuilds the whole theme on every render. Serialised rather than joined: a stroke can be `rgba(0, 0, 0, 0.5)` or `var(--brand, #fff)`, and any separator that reads naturally inside a colour cannot round-trip.
	const seriesColorKey = JSON.stringify(
		( data ?? [] )
			.map( series => series.options?.stroke )
			.filter( ( color ): color is string => Boolean( color ) )
	);

	return useMemo( () => {
		// visx applies grid, axis, and tick-label colours as SVG presentation attributes, where CSS var() cannot resolve. Resolve the catalog token against the chart's own scope element — never :root — so this reads any override set inside the provider tree, the same one a CSS-painted element would inherit.
		//
		// One resolver per theme build, so the five roles below share a single getComputedStyle call rather than taking one each: this memo re-runs only when the scope element attaches or a series colour changes, which for a dashboard of charts is the difference between two style queries per chart and ten.
		const resolve = createCssVariableResolver( scopeElement );
		const resolveColor = ( value?: string ): string | undefined =>
			value ? resolve( value ) ?? value : value;

		const seriesColors: string[] = JSON.parse( seriesColorKey );

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
	}, [ theme, seriesColorKey, scopeElement ] );
};
