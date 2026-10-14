import { render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import { firePointer, stubScreenTransform } from '../../../test-utils/pointer';
import BarChart from '../bar-chart';
import { COMPARISON_MARKER_SIZE } from '../private/overlap-constants';
import { useBarOverlapStyles } from '../use-bar-overlap-styles';

// Mock useElementSize to return non-zero dimensions in jsdom so charts render
const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

const makePoints = ( values: Array< number | null > ) =>
	values.map( ( value, index ) => ( {
		date: new Date( Date.UTC( 2024, 0, 1 + index ) ),
		value,
	} ) );

// One accent for both, as Premium Analytics passes, so overlap does not hang on palette order.
const options = { stroke: '#3858e9' };
const views = { label: 'Views', group: 'views', options, data: makePoints( [ 300, 200, 250 ] ) };
const visitors = {
	label: 'Visitors',
	group: 'visitors',
	options,
	data: makePoints( [ 120, 90, 100 ] ),
};
const viewsPrev = {
	label: 'Views prev',
	group: 'views',
	options: { type: 'comparison' as const },
	data: makePoints( [ 280, 0, 260 ] ),
};
const visitorsPrev = {
	label: 'Visitors prev',
	group: 'visitors',
	options: { type: 'comparison' as const },
	data: makePoints( [ 110, null, 95 ] ),
};

const renderWithTheme = ( props = {} ) =>
	render(
		<GlobalChartsProvider>
			<BarChart width={ 500 } height={ 300 } data={ [] } { ...props } />
		</GlobalChartsProvider>
	);

describe( 'BarChart overlap layout', () => {
	it( 'draws the larger series wide and the smaller one centered in front', () => {
		renderWithTheme( { data: [ views, visitors ], layout: 'overlap' } );

		const outer = screen.getByTestId( 'bar-chart-overlap-outer-0' );
		const inner = screen.getByTestId( 'bar-chart-overlap-inner-0' );
		expect( outer ).toHaveAttribute( 'data-series-index', '0' );
		const outerX = Number( outer.getAttribute( 'x' ) );
		const outerWidth = Number( outer.getAttribute( 'width' ) );

		expect( Number( inner.getAttribute( 'width' ) ) ).toBeCloseTo( outerWidth * 0.5 );
		expect( Number( inner.getAttribute( 'x' ) ) ).toBeCloseTo( outerX + outerWidth * 0.25 );
		expect( outer ).toHaveAttribute( 'stroke-width', '1' );
	} );

	it.each( [
		[
			'three primaries',
			{
				data: [
					views,
					visitors,
					{ label: 'Likes', group: 'likes', options, data: makePoints( [ 9, 8, 7 ] ) },
				],
			},
		],
		[ 'one primary hidden', { data: [ views, visitors ], defaultHiddenSeries: [ 'Visitors' ] } ],
	] )( 'falls back to grouped bars with %s', ( _, props ) => {
		renderWithTheme( { ...props, layout: 'overlap' } );
		expect( screen.queryByTestId( 'bar-chart-overlap-outer-0' ) ).not.toBeInTheDocument();
	} );

	// Checked on the hook: a horizontal chart would pass anyway, as overlap bars need a band x scale.
	it( 'keeps horizontal bars grouped', () => {
		const { result } = renderHook(
			() => useBarOverlapStyles( [ views, visitors ], { layout: 'overlap', horizontal: true } ),
			{ wrapper: GlobalChartsProvider }
		);
		expect( result.current ).toBeNull();
	} );

	it( 'skips a missing reading instead of drawing NaN geometry', () => {
		const gappy = { ...visitors, data: makePoints( [ 120, null, 100 ] ) };
		renderWithTheme( { data: [ views, gappy ], layout: 'overlap' } );
		expect( screen.queryByTestId( 'bar-chart-overlap-inner-1' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'bar-chart-overlap-inner-2' ) ).not.toHaveAttribute(
			'height',
			'NaN'
		);
	} );

	it( 'draws previous periods as neutral dashed lines with a marker per reading', () => {
		renderWithTheme( {
			data: [ views, visitors, viewsPrev, visitorsPrev ],
			layout: 'overlap',
			showZeroValues: true,
		} );

		const line = screen.getByTestId( 'bar-chart-comparison-line-Views prev' );
		expect( line ).toHaveAttribute( 'stroke', 'var(--a8c-charts-color-comparison-line, #1e1e1e)' );
		expect( line ).toHaveAttribute( 'stroke-dasharray', '4 4' );
		// Casing is off by default (COMPARISON_LINE_CASING = 0).
		expect(
			screen.queryByTestId( 'bar-chart-comparison-casing-Views prev' )
		).not.toBeInTheDocument();
		expect( screen.getByTestId( 'bar-chart-comparison-marker-Views prev-0' ).tagName ).toBe(
			'rect'
		);
		expect( screen.getByTestId( 'bar-chart-comparison-marker-Visitors prev-0' ).tagName ).toBe(
			'circle'
		);
		expect(
			screen.queryByTestId( 'bar-chart-comparison-marker-Visitors prev-1' )
		).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'bar-chart-comparison-bars' ) ).not.toBeInTheDocument();
	} );

	it( 'draws every comparison line before any marker', () => {
		renderWithTheme( { data: [ views, visitors, viewsPrev, visitorsPrev ], layout: 'overlap' } );

		const lastLine = screen.getByTestId( 'bar-chart-comparison-line-Visitors prev' );
		const firstMarker = screen.getByTestId( 'bar-chart-comparison-marker-Views prev-0' );
		expect( lastLine.compareDocumentPosition( firstMarker ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );

	it.each( [
		[ 'a legend item per series', {} ],
		[
			'collapsed groups',
			{
				collapseGroups: true,
				comparisonSeriesItems: ( metric: string ) => `${ metric } (Previous period)`,
			},
		],
	] )(
		'draws each previous period in the legend as its line and marker, with %s',
		( _, legend ) => {
			renderWithTheme( {
				data: [ views, visitors, viewsPrev, visitorsPrev ],
				layout: 'overlap',
				showLegend: true,
				legend,
			} );

			const [ , , viewsPrevItem, visitorsPrevItem ] = screen.getAllByTestId( 'legend-item' );
			const line = within( viewsPrevItem ).getByTestId( 'comparison-line-glyph-line' );
			expect( line ).toHaveAttribute( 'stroke-dasharray', '4 4' );
			expect( line ).toHaveAttribute( 'stroke-linecap', 'square' );
			expect( within( viewsPrevItem ).getByTestId( 'comparison-line-glyph-marker' ).tagName ).toBe(
				'rect'
			);
			expect(
				within( visitorsPrevItem ).getByTestId( 'comparison-line-glyph-marker' ).tagName
			).toBe( 'circle' );
		}
	);

	it( 'plots a zero reading at zero, not at the zero-value stub', () => {
		renderWithTheme( {
			data: [ views, visitors, viewsPrev, visitorsPrev ],
			layout: 'overlap',
			showZeroValues: true,
		} );
		// views[1] is 200, so its outer bar runs from y to the baseline.
		const outer = screen.getByTestId( 'bar-chart-overlap-outer-1' );
		const baseline = Number( outer.getAttribute( 'y' ) ) + Number( outer.getAttribute( 'height' ) );
		const marker = screen.getByTestId( 'bar-chart-comparison-marker-Views prev-1' );
		expect( Number( marker.getAttribute( 'y' ) ) + COMPARISON_MARKER_SIZE ).toBeCloseTo( baseline );
		expect( Number( marker.getAttribute( 'x' ) ) + COMPARISON_MARKER_SIZE ).toBeCloseTo(
			Number( outer.getAttribute( 'x' ) ) + Number( outer.getAttribute( 'width' ) ) / 2
		);
	} );

	it( 'outlines the narrow inner bar when the keyboard lands on it', async () => {
		const user = userEvent.setup();
		renderWithTheme( { data: [ views, visitors ], layout: 'overlap', withTooltips: true } );

		await user.tab();
		await user.keyboard( '{ArrowRight}{ArrowRight}' ); // views[0] → visitors[0]

		expect( screen.getByTestId( 'bar-chart-keyboard-highlight' ) ).toHaveTextContent(
			/\.bar-chart__overlap-bar\[data-series-index="1"\]\[data-point-index="0"\]/
		);
	} );

	it( 'outlines the inner bar when the outer series comes second in the data', async () => {
		const user = userEvent.setup();
		renderWithTheme( { data: [ visitors, views ], layout: 'overlap', withTooltips: true } );
		expect( screen.getByTestId( 'bar-chart-overlap-outer-0' ) ).toHaveAttribute(
			'data-series-index',
			'1'
		);

		await user.tab();
		await user.keyboard( '{ArrowRight}' ); // visitors[0], drawn after every outer bar

		expect( screen.getByTestId( 'bar-chart-keyboard-highlight' ) ).toHaveTextContent(
			/\.bar-chart__overlap-bar\[data-series-index="0"\]\[data-point-index="0"\]/
		);
		const inner = screen.getByTestId( 'bar-chart-overlap-inner-0' );
		expect( inner ).toHaveAttribute( 'data-series-index', '0' );
		expect( inner ).toHaveAttribute( 'data-point-index', '0' );
	} );

	describe( 'pointer', () => {
		stubScreenTransform();

		it.each( [
			[ 'the band center', 0.5, 'Visitors' ],
			[ 'the left of the inner bar', 0.3, 'Visitors' ],
			[ 'the left band edge', 0.05, 'Views' ],
			[ 'the right band edge', 0.95, 'Views' ],
		] )( 'reads %s as the right series', async ( _, at, expected ) => {
			renderWithTheme( { data: [ views, visitors ], layout: 'overlap', withTooltips: true } );
			const outer = screen.getByTestId( 'bar-chart-overlap-outer-0' );
			const bandStart = Number( outer.getAttribute( 'x' ) );
			const bandwidth = Number( outer.getAttribute( 'width' ) );

			firePointer( 'pointermove', bandStart + bandwidth * at, 150 );

			await expect( screen.findByRole( 'tooltip' ) ).resolves.toHaveTextContent( expected );
		} );
	} );
} );
