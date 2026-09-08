import { buildChartTheme } from '@visx/xychart';
import { useMemo } from 'react';
import { useGlobalChartsTheme } from '../providers';
import { CATALOG_POINTERS } from '../providers/chart-context/private/catalog-pointers';
import { useChartScopeElement } from '../providers/chart-scope';
import { createCssVariableResolver, normalizeColorToHex } from '../utils';
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
		// Only what is read as a string is resolved: the palette, `backgroundColor`, `htmlLabel.color`.
		// At the chart's scope element, never :root, so an override inside the provider tree is seen.
		// One resolver for all three, so they share a single getComputedStyle call.
		const resolve = createCssVariableResolver( scopeElement );
		const resolveColor = ( value?: string ): string | undefined =>
			value ? resolve( value ) ?? value : value;

		const seriesColors: string[] = JSON.parse( seriesColorKey );

		// visx uses this as the default stroke for a series without one, so an
		// unresolved entry paints nothing.
		const paletteColors = [ ...seriesColors, ...CATALOG_POINTERS.series ]
			.map( color => resolveColor( color ) )
			.filter( ( color ): color is string => Boolean( color ) && ! color.includes( 'var(' ) );

		// The tooltip is painted in a portal outside the scope, and visx concatenates this color into a `box-shadow` where a chain cannot take a suffix; see TOKENS.md#the-svg-bridge. Passing it explicitly leaves `svgLabelSmall.fill`, which visx derives it from, a chain for the SVG tick labels.
		// Hex specifically: that concatenation appends `55`, which only yields a color
		// after a 6-digit hex. An `rgb()` computed value takes the whole shadow down.
		const resolvedLabelColor = resolveColor( CATALOG_POINTERS.labelAxis );
		const htmlLabelColor = resolvedLabelColor
			? normalizeColorToHex( resolvedLabelColor ) || resolvedLabelColor
			: resolvedLabelColor;

		// visx's fallbacks for whichever axis or grid style object it is not given. All four are
		// supplied, so these reach nothing; they stay because the config type requires them.
		return buildChartTheme( {
			...theme,
			gridColor: '',
			gridColorDark: '',
			colors: paletteColors,
			backgroundColor: resolveColor( CATALOG_POINTERS.background ),
			htmlLabel: htmlLabelColor ? { color: htmlLabelColor } : undefined,
			gridStyles: { ...theme.gridStyles, stroke: CATALOG_POINTERS.grid },
			xAxisLineStyles: { ...theme.xAxisLineStyles, stroke: CATALOG_POINTERS.axisX },
			xTickLineStyles: { ...theme.xTickLineStyles, stroke: CATALOG_POINTERS.tickX },
			yAxisLineStyles: { stroke: CATALOG_POINTERS.axisY },
			yTickLineStyles: { stroke: CATALOG_POINTERS.tickY },
			svgLabelSmall: { ...theme.svgLabelSmall, fill: CATALOG_POINTERS.labelAxis },
		} );
	}, [ theme, seriesColorKey, scopeElement ] );
};
