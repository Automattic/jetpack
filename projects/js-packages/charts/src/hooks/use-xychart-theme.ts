import { buildChartTheme } from '@visx/xychart';
import { useMemo } from 'react';
import { useGlobalChartsTheme } from '../providers';
import { useChartScopeElement } from '../providers/chart-scope';
import { createCssVariableResolver } from '../utils';
import type { SeriesData } from '../types';

export const useXYChartTheme = ( data: SeriesData[] ) => {
	const theme = useGlobalChartsTheme();
	const scopeElement = useChartScopeElement();

	// The only thing the theme takes from `data` is the series strokes, so key the memo on those rather than on the array's identity. A caller passing an inline literal — `<LineChart data={ [ … ] } />`, which the stories and several consumers do — otherwise rebuilds the whole theme on every render. Serialized rather than joined: a stroke can be `rgba(0, 0, 0, 0.5)` or `var(--brand, #fff)`, and any separator that reads naturally inside a color cannot round-trip.
	const seriesColorKey = JSON.stringify(
		( data ?? [] )
			.map( series => series.options?.stroke )
			.filter( ( color ): color is string => Boolean( color ) )
	);

	return useMemo( () => {
		// What is left here is the JS-consumed tail: the palette, which visx turns into its `colorScale`, and `backgroundColor`, which our own components read as a value — the glyph stroke, the area-chart band stroke, the heatmap's contrast math. Those need a concrete string, so they are resolved against the chart's own scope element — never :root — which reads any override set inside the provider tree, the same one a CSS-painted element would inherit.
		//
		// One resolver per theme build, so both share a single getComputedStyle call: this memo re-runs only when the scope element attaches or a series color changes.
		const resolve = createCssVariableResolver( scopeElement );
		const resolveColor = ( value?: string ): string | undefined =>
			value ? resolve( value ) ?? value : value;

		const seriesColors: string[] = JSON.parse( seriesColorKey );

		// The palette gets the same treatment as every other color here, and needs it more: `theme.colors` is the one field that is always a `var()` chain, and the four slots without a catalog default resolve to nothing at all. visx builds its `colorScale` from this array and uses it as the default stroke for a series rendered without an explicit one, so an unresolved entry paints nothing rather than degrading. Entries that resolve to nothing are dropped so the scale compacts the way the provider's own palette does.
		const paletteColors = [ ...seriesColors, ...( theme.colors ?? [] ) ]
			.map( color => resolveColor( color ) )
			.filter( ( color ): color is string => Boolean( color ) && ! color.includes( 'var(' ) );

		return buildChartTheme( {
			...theme,
			colors: paletteColors,
			backgroundColor: resolveColor( theme.backgroundColor ),
			// `chart-paint.scss` paints the grid, axis line, tick lines and tick labels, so their colors must not reach `buildChartTheme`: a value here becomes an inline style or a presentation attribute carrying the literal, and the first of those beats the stylesheet outright. Dropping them is what lets CSS own the roles.
			gridStyles: theme.gridStyles && {
				...theme.gridStyles,
				stroke: undefined,
			},
			xAxisLineStyles: theme.xAxisLineStyles && {
				...theme.xAxisLineStyles,
				stroke: undefined,
			},
			xTickLineStyles: theme.xTickLineStyles && {
				...theme.xTickLineStyles,
				stroke: undefined,
			},
			svgLabelSmall: theme.svgLabelSmall && {
				...theme.svgLabelSmall,
				fill: undefined,
			},
		} );
	}, [ theme, seriesColorKey, scopeElement ] );
};
