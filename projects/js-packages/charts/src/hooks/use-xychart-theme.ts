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
		// Only what is read as a string is resolved here — the palette and `backgroundColor` — plus `htmlLabel.color` below, which is painted outside the scope. Resolving against the chart's own scope element, never :root, is what reads an override set inside the provider tree.
		//
		// One resolver per theme build, so all three share a single getComputedStyle call.
		const resolve = createCssVariableResolver( scopeElement );
		const resolveColor = ( value?: string ): string | undefined =>
			value ? resolve( value ) ?? value : value;

		const seriesColors: string[] = JSON.parse( seriesColorKey );

		// The palette gets the same treatment as every other color here, and needs it more: `theme.colors` is the one field that is always a `var()` chain, and the four slots without a catalog default resolve to nothing at all. visx builds its `colorScale` from this array and uses it as the default stroke for a series rendered without an explicit one, so an unresolved entry paints nothing rather than degrading. Entries that resolve to nothing are dropped so the scale compacts the way the provider's own palette does.
		const paletteColors = [ ...seriesColors, ...( theme.colors ?? [] ) ]
			.map( color => resolveColor( color ) )
			.filter( ( color ): color is string => Boolean( color ) && ! color.includes( 'var(' ) );

		// The tooltip is painted in a portal outside the scope, and visx concatenates this color into a `box-shadow` where a chain cannot take a suffix; see TOKENS.md#the-svg-bridge. Passing it explicitly leaves `svgLabelSmall.fill`, which visx derives it from, a chain for the SVG tick labels.
		const htmlLabelColor = resolveColor( theme.svgLabelSmall?.fill );

		// The grid, axis, tick and label colors are spread through untouched, and that is the whole mechanism: visx writes each one onto the element it paints — as an inline style for the grid, a presentation attribute elsewhere — and a `var()` chain resolves there natively. So the role is read at the painted element rather than snapshot at the provider wrapper, which is what makes an override on a chart's own class work, keeps a theme change live without a re-render, and leaves nothing to resolve during SSR. Resolving them here would freeze the color instead.
		return buildChartTheme( {
			...theme,
			colors: paletteColors,
			backgroundColor: resolveColor( theme.backgroundColor ),
			htmlLabel: htmlLabelColor ? { color: htmlLabelColor } : undefined,
		} );
	}, [ theme, seriesColorKey, scopeElement ] );
};
