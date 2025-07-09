import { render, screen, renderHook } from '@testing-library/react';
import { defaultTheme } from '../../providers/theme';
import { ChartLegend } from './chart-legend';
import { useChartLegendData } from './use-chart-legend-data';
import type { SeriesData, DataPointPercentage } from '../../types';

// Mock the BaseLegend component
jest.mock( '../legend/base-legend', () => ( {
	BaseLegend: ( {
		items,
		orientation,
		testId,
	}: {
		items: Array< { label: string; value: string; color: string } >;
		orientation: string;
		testId?: string;
	} ) => (
		<div data-testid={ testId || 'base-legend' }>
			<div data-testid="legend-orientation">{ orientation }</div>
			{ items.map( ( item: { label: string; value: string; color: string }, index: number ) => (
				<div key={ index } data-testid={ `legend-item-${ index }` }>
					<span data-testid="legend-label">{ item.label }</span>
					<span data-testid="legend-value">{ item.value }</span>
					<span data-testid="legend-color">{ item.color }</span>
				</div>
			) ) }
		</div>
	),
} ) );

describe( 'ChartLegend', () => {
	const mockItems = [
		{ label: 'Desktop', value: '65%', color: '#3858E9' },
		{ label: 'Mobile', value: '35%', color: '#80C8FF' },
	];

	it( 'renders legend items correctly', () => {
		render( <ChartLegend items={ mockItems } orientation="horizontal" /> );

		expect( screen.getByTestId( 'base-legend' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'legend-orientation' ) ).toHaveTextContent( 'horizontal' );
		expect( screen.getByTestId( 'legend-item-0' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'legend-item-1' ) ).toBeInTheDocument();
	} );

	it( 'passes through props to BaseLegend', () => {
		render(
			<ChartLegend
				items={ mockItems }
				orientation="vertical"
				alignmentHorizontal="left"
				alignmentVertical="top"
			/>
		);

		expect( screen.getByTestId( 'legend-orientation' ) ).toHaveTextContent( 'vertical' );
	} );

	it( 'accepts chartId prop for future context integration', () => {
		// This test ensures the prop is accepted without error
		expect( () => {
			render( <ChartLegend items={ mockItems } chartId="test-chart-id" /> );
		} ).not.toThrow();
	} );

	it( 'renders correct legend labels and values', () => {
		render( <ChartLegend items={ mockItems } /> );

		const labels = screen.getAllByTestId( 'legend-label' );
		const values = screen.getAllByTestId( 'legend-value' );
		const colors = screen.getAllByTestId( 'legend-color' );

		expect( labels[ 0 ] ).toHaveTextContent( 'Desktop' );
		expect( labels[ 1 ] ).toHaveTextContent( 'Mobile' );
		expect( values[ 0 ] ).toHaveTextContent( '65%' );
		expect( values[ 1 ] ).toHaveTextContent( '35%' );
		expect( colors[ 0 ] ).toHaveTextContent( '#3858E9' );
		expect( colors[ 1 ] ).toHaveTextContent( '#80C8FF' );
	} );
} );

describe( 'useChartLegendData', () => {
	const mockTheme = {
		...defaultTheme,
		colors: [ '#3858E9', '#80C8FF', '#44B556' ],
	};

	describe( 'with SeriesData[]', () => {
		const seriesData: SeriesData[] = [
			{
				label: 'Desktop',
				data: [
					{ date: new Date( '2023-01-01' ), value: 100 },
					{ date: new Date( '2023-01-02' ), value: 150 },
				],
			},
			{
				label: 'Mobile',
				data: [
					{ date: new Date( '2023-01-01' ), value: 80 },
					{ date: new Date( '2023-01-02' ), value: 90 },
				],
				options: {
					stroke: '#FF0000',
					legendShapeStyle: { borderRadius: '4px' },
				},
			},
		];

		it( 'converts SeriesData to BaseLegendItem format', () => {
			const { result } = renderHook( () => useChartLegendData( seriesData, mockTheme ) );

			expect( result.current ).toEqual( [
				{
					label: 'Desktop',
					value: '',
					color: '#3858E9',
					shapeStyle: undefined,
					renderGlyph: undefined,
					glyphSize: 4,
				},
				{
					label: 'Mobile',
					value: '',
					color: '#FF0000',
					shapeStyle: { borderRadius: '4px' },
					renderGlyph: undefined,
					glyphSize: 4,
				},
			] );
		} );

		it( 'shows values when showValues option is true', () => {
			const { result } = renderHook( () =>
				useChartLegendData( seriesData, mockTheme, { showValues: true } )
			);

			expect( result.current[ 0 ].value ).toBe( '' );
			expect( result.current[ 1 ].value ).toBe( '' );
		} );

		it( 'includes glyph when withGlyph option is true', () => {
			const mockRenderGlyph = jest.fn();
			const themeWithGlyph = {
				...mockTheme,
				glyphs: [ mockRenderGlyph ],
			};

			const { result } = renderHook( () =>
				useChartLegendData( seriesData, themeWithGlyph, { withGlyph: true, glyphSize: 8 } )
			);

			expect( result.current[ 0 ].renderGlyph ).toBe( mockRenderGlyph );
			expect( result.current[ 0 ].glyphSize ).toBe( 8 );
		} );
	} );

	describe( 'with DataPointPercentage[]', () => {
		const pieData: DataPointPercentage[] = [
			{ label: 'Desktop', value: 65, percentage: 65 },
			{ label: 'Mobile', value: 35, percentage: 35 },
		];

		it( 'converts DataPointPercentage to BaseLegendItem format', () => {
			const { result } = renderHook( () => useChartLegendData( pieData, mockTheme ) );

			expect( result.current ).toEqual( [
				{
					label: 'Desktop',
					value: '',
					color: '#3858E9',
					shapeStyle: undefined,
					renderGlyph: undefined,
					glyphSize: 4,
				},
				{
					label: 'Mobile',
					value: '',
					color: '#80C8FF',
					shapeStyle: undefined,
					renderGlyph: undefined,
					glyphSize: 4,
				},
			] );
		} );

		it( 'shows values when showValues option is true', () => {
			const { result } = renderHook( () =>
				useChartLegendData( pieData, mockTheme, { showValues: true } )
			);

			expect( result.current[ 0 ].value ).toBe( '65' );
			expect( result.current[ 1 ].value ).toBe( '35' );
		} );

		it( 'cycles through theme colors correctly', () => {
			const largeDataSet: DataPointPercentage[] = [
				{ label: 'A', value: 25, percentage: 25 },
				{ label: 'B', value: 25, percentage: 25 },
				{ label: 'C', value: 25, percentage: 25 },
				{ label: 'D', value: 25, percentage: 25 },
			];

			const { result } = renderHook( () => useChartLegendData( largeDataSet, mockTheme ) );

			expect( result.current[ 0 ].color ).toBe( '#3858E9' );
			expect( result.current[ 1 ].color ).toBe( '#80C8FF' );
			expect( result.current[ 2 ].color ).toBe( '#44B556' );
			expect( result.current[ 3 ].color ).toBe( '#3858E9' ); // Cycles back to first color
		} );
	} );

	it( 'handles empty data arrays', () => {
		const { result } = renderHook( () => useChartLegendData( [], mockTheme ) );

		expect( result.current ).toEqual( [] );
	} );

	it( 'memoizes results correctly', () => {
		const testData = [ { label: 'Test', value: 100, percentage: 100 } ] as DataPointPercentage[];
		const testOptions = { showValues: true };

		const { result, rerender } = renderHook(
			( { data, theme, options } ) => useChartLegendData( data, theme, options ),
			{
				initialProps: {
					data: testData,
					theme: mockTheme,
					options: testOptions,
				},
			}
		);

		const firstResult = result.current;

		// Re-render with same props - should return same reference
		rerender( {
			data: testData,
			theme: mockTheme,
			options: testOptions,
		} );

		expect( result.current ).toBe( firstResult );
	} );
} );
