import type { ReactNode } from 'react';

type ChartSeries = { label: string; options?: { type?: string } };

type ElementStylesParams = { data: ChartSeries; index: number };

type ElementStyles = {
	color: string;
	barStyles?: Record< string, unknown >;
	lineStyles?: Record< string, unknown >;
};

/** Props each chart stand-in rendered with. The real charts lay out SVG jsdom cannot. */
export const mockBarChartSpy = jest.fn();
export const mockBarChartLegendSpy = jest.fn();
export const mockLineChartSpy = jest.fn();
export const mockLineChartLegendSpy = jest.fn();

// Mirrors the real theme: a comparison series shares its primary's colour and is
// set apart only by opacity.
const defaultElementStyles = ( { data }: ElementStylesParams ): ElementStyles => ( {
	color: '#3858E9',
	barStyles: data?.options?.type === 'comparison' ? { widthFactor: 1.5, opacity: 0.5 } : {},
} );

/** The sparkline margin the charts context's theme hands out. */
export const mockSparklineMargin = { top: 2, right: 2, bottom: 2, left: 2 };

let elementStyles = defaultElementStyles;
let hiddenSeries = new Set< string >();
let chartHeight: number | undefined;

/**
 * Set the theme styles the charts context hands out.
 *
 * @param getElementStyles - Styles for a series at an index.
 */
export function setMockElementStyles(
	getElementStyles: ( params: ElementStylesParams ) => ElementStyles = defaultElementStyles
): void {
	elementStyles = getElementStyles;
}

/**
 * Set the series the charts context reports hidden.
 *
 * @param labels - Hidden series labels.
 */
export function setMockHiddenSeries( labels: string[] = [] ): void {
	hiddenSeries = new Set( labels );
}

/**
 * Set the height a resize observer reports on mount. Unset, it never reports, as in jsdom.
 *
 * @param height - Measured height in px.
 */
export function setMockChartHeight( height?: number ): void {
	chartHeight = height;
}

/** Clear the chart spies and restore the default theme, visibility and size. */
export function resetMockCharts(): void {
	[ mockBarChartSpy, mockBarChartLegendSpy, mockLineChartSpy, mockLineChartLegendSpy ].forEach(
		spy => spy.mockClear()
	);
	setMockElementStyles();
	setMockHiddenSeries();
	setMockChartHeight();
}

const BarChart = ( props: { children?: ReactNode } ) => {
	mockBarChartSpy( props );
	// Children render so the legend, which the wrappers mount conditionally, is observable.
	return <div data-testid="bar-chart">{ props.children }</div>;
};
BarChart.Legend = ( props: Record< string, unknown > ) => {
	mockBarChartLegendSpy( props );
	return <div data-testid="bar-chart-legend" />;
};

const LineChart = ( props: { children?: ReactNode } ) => {
	mockLineChartSpy( props );
	return <div data-testid="line-chart">{ props.children }</div>;
};
LineChart.Legend = ( props: Record< string, unknown > ) => {
	mockLineChartLegendSpy( props );
	return <div data-testid="line-chart-legend" />;
};

// Stands in for a legend or tooltip shape, exposing the colour it was handed.
const Swatch = ( { fill }: { fill: string } ) => <span data-testid="swatch" data-fill={ fill } />;

/**
 * Shared Jest replacement for the externals barrel, with the chart library stood in. A
 * function, as the real barrel loads `@wordpress/compose`, whose mock is read from here.
 *
 * @return The module.
 */
export const mockChartExternals = () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/externals' ),
	BarChart,
	LineChart,
	LineShape: Swatch,
	RectShape: Swatch,
	Sparkline: ( { data }: { data: number[] } ) => (
		<div data-testid="sparkline" data-points={ data.join( ',' ) } />
	),
	// One item per non-comparison series, as `collapseGroups` would produce.
	useChartLegendItems: ( data: ChartSeries[] ) =>
		data
			.filter( series => series.options?.type !== 'comparison' )
			.map( series => ( { label: series.label, color: '#3858E9' } ) ),
	useGlobalChartsContext: () => ( {
		getElementStyles: ( params: ElementStylesParams ) => elementStyles( params ),
		getHiddenSeries: () => new Set( hiddenSeries ),
		theme: { sparkline: { margin: mockSparklineMargin } },
	} ),
} );

/** Shared Jest replacement for `@wordpress/compose`, reporting the size `setMockChartHeight` set. */
export const mockWordPressCompose = {
	// `@wordpress/data` needs the rest of the real module.
	...jest.requireActual( '@wordpress/compose' ),
	useResizeObserver:
		( onResize: ( entries: { contentRect: { height: number } }[] ) => void ) =>
		( element: HTMLElement | null ) => {
			if ( element && chartHeight !== undefined ) {
				onResize( [ { contentRect: { height: chartHeight } } ] );
			}
		},
};
