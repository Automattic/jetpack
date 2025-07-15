import { renderHook } from '@testing-library/react';
import { useChartLegendData } from './use-chart-legend-data';
import type { ChartTheme, SeriesData, DataPointPercentage } from '../../types';

// Mock theme data
const mockTheme: ChartTheme = {
	colors: [ '#ff0000', '#00ff00', '#0000ff' ],
	backgroundColor: '#ffffff',
	gridColor: '#e0e0e0',
	gridColorDark: '#666666',
	tickLength: 5,
	legendLabelStyles: {},
	seriesLineStyles: [],
	glyphs: [],
};

// Mock series data
const mockSeriesData: SeriesData[] = [
	{
		label: 'Series 1',
		data: [
			{ date: new Date( '2023-01-01' ), value: 100 },
			{ date: new Date( '2023-01-02' ), value: 150 },
		],
	},
	{
		label: 'Series 2',
		data: [
			{ date: new Date( '2023-01-01' ), value: 80 },
			{ date: new Date( '2023-01-02' ), value: 90 },
		],
	},
];

// Mock percentage data
const mockPercentageData: DataPointPercentage[] = [
	{ label: 'Desktop', percentage: 65, value: 650, color: '#ff0000' },
	{ label: 'Mobile', percentage: 35, value: 350, color: '#00ff00' },
];

describe( 'useChartLegendData', () => {
	describe( 'SeriesData handling', () => {
		test( 'returns legend items without values by default', () => {
			const { result } = renderHook( () => useChartLegendData( mockSeriesData, mockTheme ) );

			expect( result.current ).toEqual( [
				{ label: 'Series 1', value: '', color: '#ff0000' },
				{ label: 'Series 2', value: '', color: '#00ff00' },
			] );
		} );

		test( 'returns legend items with data count when showValues is true', () => {
			const { result } = renderHook( () =>
				useChartLegendData( mockSeriesData, mockTheme, { showValues: true } )
			);

			expect( result.current ).toEqual( [
				{ label: 'Series 1', value: '2', color: '#ff0000' },
				{ label: 'Series 2', value: '2', color: '#00ff00' },
			] );
		} );

		test( 'handles empty series data', () => {
			const emptySeries: SeriesData[] = [ { label: 'Empty Series', data: [] } ];

			const { result } = renderHook( () =>
				useChartLegendData( emptySeries, mockTheme, { showValues: true } )
			);

			expect( result.current ).toEqual( [
				{ label: 'Empty Series', value: '0', color: '#ff0000' },
			] );
		} );

		test( 'cycles through theme colors for multiple series', () => {
			const manySeries: SeriesData[] = [
				{ label: 'Series 1', data: [ { date: new Date(), value: 1 } ] },
				{ label: 'Series 2', data: [ { date: new Date(), value: 2 } ] },
				{ label: 'Series 3', data: [ { date: new Date(), value: 3 } ] },
				{ label: 'Series 4', data: [ { date: new Date(), value: 4 } ] },
			];

			const { result } = renderHook( () => useChartLegendData( manySeries, mockTheme ) );

			expect( result.current ).toEqual( [
				{ label: 'Series 1', value: '', color: '#ff0000' }, // colors[0]
				{ label: 'Series 2', value: '', color: '#00ff00' }, // colors[1]
				{ label: 'Series 3', value: '', color: '#0000ff' }, // colors[2]
				{ label: 'Series 4', value: '', color: '#ff0000' }, // colors[0] (cycles back)
			] );
		} );
	} );

	describe( 'DataPointPercentage handling', () => {
		test( 'returns legend items without values by default', () => {
			const { result } = renderHook( () => useChartLegendData( mockPercentageData, mockTheme ) );

			expect( result.current ).toEqual( [
				{ label: 'Desktop', value: '', color: '#ff0000' },
				{ label: 'Mobile', value: '', color: '#00ff00' },
			] );
		} );

		test( 'returns legend items with percentage values when showValues is true', () => {
			const { result } = renderHook( () =>
				useChartLegendData( mockPercentageData, mockTheme, { showValues: true } )
			);

			expect( result.current ).toEqual( [
				{ label: 'Desktop', value: '65%', color: '#ff0000' },
				{ label: 'Mobile', value: '35%', color: '#00ff00' },
			] );
		} );

		test( 'uses data point colors when available', () => {
			const { result } = renderHook( () => useChartLegendData( mockPercentageData, mockTheme ) );

			expect( result.current ).toEqual( [
				{ label: 'Desktop', value: '', color: '#ff0000' },
				{ label: 'Mobile', value: '', color: '#00ff00' },
			] );
		} );

		test( 'falls back to theme colors when data point colors not available', () => {
			const dataWithoutColors: DataPointPercentage[] = [
				{ label: 'Desktop', percentage: 65, value: 650 },
				{ label: 'Mobile', percentage: 35, value: 350 },
			];

			const { result } = renderHook( () => useChartLegendData( dataWithoutColors, mockTheme ) );

			expect( result.current ).toEqual( [
				{ label: 'Desktop', value: '', color: '#ff0000' },
				{ label: 'Mobile', value: '', color: '#00ff00' },
			] );
		} );
	} );

	describe( 'Glyph handling', () => {
		test( 'returns legend items with glyph properties when withGlyph is true', () => {
			const mockRenderGlyph = jest.fn();

			const { result } = renderHook( () =>
				useChartLegendData( mockPercentageData, mockTheme, {
					withGlyph: true,
					glyphSize: 12,
					renderGlyph: mockRenderGlyph,
				} )
			);

			expect( result.current ).toEqual( [
				{
					label: 'Desktop',
					value: '',
					color: '#ff0000',
					glyphSize: 12,
					renderGlyph: mockRenderGlyph,
				},
				{
					label: 'Mobile',
					value: '',
					color: '#00ff00',
					glyphSize: 12,
					renderGlyph: mockRenderGlyph,
				},
			] );
		} );

		test( 'returns legend items without glyph properties when withGlyph is false', () => {
			const mockRenderGlyph = jest.fn();

			const { result } = renderHook( () =>
				useChartLegendData( mockPercentageData, mockTheme, {
					withGlyph: false,
					glyphSize: 12,
					renderGlyph: mockRenderGlyph,
				} )
			);

			expect( result.current ).toEqual( [
				{ label: 'Desktop', value: '', color: '#ff0000' },
				{ label: 'Mobile', value: '', color: '#00ff00' },
			] );
		} );

		test( 'uses default glyphSize when not provided', () => {
			const mockRenderGlyph = jest.fn();

			const { result } = renderHook( () =>
				useChartLegendData( mockPercentageData, mockTheme, {
					withGlyph: true,
					renderGlyph: mockRenderGlyph,
				} )
			);

			expect( result.current ).toEqual( [
				{
					label: 'Desktop',
					value: '',
					color: '#ff0000',
					glyphSize: 8,
					renderGlyph: mockRenderGlyph,
				},
				{
					label: 'Mobile',
					value: '',
					color: '#00ff00',
					glyphSize: 8,
					renderGlyph: mockRenderGlyph,
				},
			] );
		} );
	} );

	describe( 'Edge cases', () => {
		test( 'returns empty array for empty data', () => {
			const { result } = renderHook( () => useChartLegendData( [], mockTheme ) );

			expect( result.current ).toEqual( [] );
		} );

		test( 'returns empty array for null data', () => {
			const { result } = renderHook( () =>
				useChartLegendData( null as unknown as SeriesData[], mockTheme )
			);

			expect( result.current ).toEqual( [] );
		} );

		test( 'returns empty array for undefined data', () => {
			const { result } = renderHook( () =>
				useChartLegendData( undefined as unknown as SeriesData[], mockTheme )
			);

			expect( result.current ).toEqual( [] );
		} );

		test( 'memoizes result and only recalculates when dependencies change', () => {
			const { result, rerender } = renderHook(
				( { data, theme, options } ) => useChartLegendData( data, theme, options ),
				{
					initialProps: {
						data: mockSeriesData,
						theme: mockTheme,
						options: { showValues: false },
					},
				}
			);

			const firstResult = result.current;

			// Rerender with same props - should return same reference
			rerender( {
				data: mockSeriesData,
				theme: mockTheme,
				options: { showValues: false },
			} );

			expect( result.current ).toBe( firstResult );

			// Rerender with different props - should return new reference
			rerender( {
				data: mockSeriesData,
				theme: mockTheme,
				options: { showValues: true },
			} );

			expect( result.current ).not.toBe( firstResult );
		} );
	} );
} );
