import { render, renderHook, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import BarChart from '../bar-chart';
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

const views = { label: 'Views', group: 'views', data: makePoints( [ 300, 200, 250 ] ) };
const visitors = { label: 'Visitors', group: 'visitors', data: makePoints( [ 120, 90, 100 ] ) };

const renderWithTheme = ( props = {} ) =>
	render(
		<GlobalChartsProvider>
			<BarChart width={ 500 } height={ 300 } data={ [] } { ...props } />
		</GlobalChartsProvider>
	);

// Visitors goes first: the default blue as the outer bar cannot keep 3:1 against green.
describe( 'BarChart overlap layout', () => {
	it( 'draws the larger series wide and the smaller one centered in front', () => {
		renderWithTheme( { data: [ visitors, views ], layout: 'overlap' } );

		const outer = screen.getByTestId( 'bar-chart-overlap-outer-0' );
		const inner = screen.getByTestId( 'bar-chart-overlap-inner-0' );
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
					visitors,
					views,
					{ label: 'Likes', group: 'likes', data: makePoints( [ 9, 8, 7 ] ) },
				],
			},
		],
		[ 'horizontal', { data: [ visitors, views ], orientation: 'horizontal' } ],
		[ 'one primary hidden', { data: [ visitors, views ], defaultHiddenSeries: [ 'Visitors' ] } ],
	] )( 'falls back to grouped bars with %s', ( _, props ) => {
		renderWithTheme( { ...props, layout: 'overlap' } );
		expect( screen.queryByTestId( 'bar-chart-overlap-outer-0' ) ).not.toBeInTheDocument();
	} );

	// The chart row above passes either way: overlap bars draw nothing without a band x scale.
	it( 'keeps horizontal bars grouped', () => {
		// Ungrouped series take colors by index; grouped ones by first request, which is the outer.
		const series = [ visitors, views ].map( ( { label, data } ) => ( { label, data } ) );
		const { result } = renderHook(
			() => useBarOverlapStyles( series, { layout: 'overlap', horizontal: true } ),
			{ wrapper: GlobalChartsProvider }
		);
		expect( result.current ).toBeNull();
	} );

	it( 'skips a missing reading instead of drawing NaN geometry', () => {
		const gappy = { ...visitors, data: makePoints( [ 120, null, 100 ] ) };
		renderWithTheme( { data: [ gappy, views ], layout: 'overlap' } );
		expect( screen.queryByTestId( 'bar-chart-overlap-inner-1' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'bar-chart-overlap-inner-2' ) ).not.toHaveAttribute(
			'height',
			'NaN'
		);
	} );
} );
