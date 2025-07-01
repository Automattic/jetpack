import { renderHook } from '@testing-library/react';
import { useChartDataTransform } from '../use-chart-data-transform';
import type { SeriesData } from '../../../types';

describe( 'useChartDataTransform', () => {
	it( 'should return data unchanged when no date properties are present', () => {
		const mockData: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'Point 1', value: 10 },
					{ label: 'Point 2', value: 20 },
					{ label: 'Point 3', value: 15 },
				],
			},
		];

		const { result } = renderHook( () => useChartDataTransform( mockData ) );

		expect( result.current ).toEqual( mockData );
	} );

	it( 'should transform and sort data with date properties', () => {
		const mockData: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ dateString: '2023-03-15', value: 15 },
					{ dateString: '2023-03-10', value: 10 },
					{ dateString: '2023-03-20', value: 20 },
				],
			},
		];

		const { result } = renderHook( () => useChartDataTransform( mockData ) );

		expect( result.current[ 0 ].data ).toHaveLength( 3 );
		expect( result.current[ 0 ].data[ 0 ].value ).toBe( 10 ); // Earliest date
		expect( result.current[ 0 ].data[ 1 ].value ).toBe( 15 ); // Middle date
		expect( result.current[ 0 ].data[ 2 ].value ).toBe( 20 ); // Latest date
		expect( result.current[ 0 ].data[ 0 ].date ).toBeInstanceOf( Date );
		expect( result.current[ 0 ].data[ 1 ].date ).toBeInstanceOf( Date );
		expect( result.current[ 0 ].data[ 2 ].date ).toBeInstanceOf( Date );
	} );

	it( 'should handle data with existing Date objects', () => {
		const date1 = new Date( '2023-03-10' );
		const date2 = new Date( '2023-03-15' );
		const date3 = new Date( '2023-03-20' );

		const mockData: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ date: date3, value: 20 },
					{ date: date1, value: 10 },
					{ date: date2, value: 15 },
				],
			},
		];

		const { result } = renderHook( () => useChartDataTransform( mockData ) );

		expect( result.current[ 0 ].data ).toHaveLength( 3 );
		expect( result.current[ 0 ].data[ 0 ].value ).toBe( 10 ); // Earliest date
		expect( result.current[ 0 ].data[ 1 ].value ).toBe( 15 ); // Middle date
		expect( result.current[ 0 ].data[ 2 ].value ).toBe( 20 ); // Latest date
	} );

	it( 'should handle mixed date and dateString properties', () => {
		const date1 = new Date( '2023-03-10' );
		const mockData: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ date: date1, value: 10 },
					{ dateString: '2023-03-20', value: 20 },
					{ dateString: '2023-03-15', value: 15 },
				],
			},
		];

		const { result } = renderHook( () => useChartDataTransform( mockData ) );

		expect( result.current[ 0 ].data ).toHaveLength( 3 );
		expect( result.current[ 0 ].data[ 0 ].value ).toBe( 10 ); // Earliest date
		expect( result.current[ 0 ].data[ 1 ].value ).toBe( 15 ); // Middle date
		expect( result.current[ 0 ].data[ 2 ].value ).toBe( 20 ); // Latest date
	} );

	it( 'should handle empty data array', () => {
		const mockData: SeriesData[] = [];

		const { result } = renderHook( () => useChartDataTransform( mockData ) );

		expect( result.current ).toEqual( [] );
	} );

	it( 'should handle data with undefined or null dates', () => {
		const mockData: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ dateString: '2023-03-15', value: 15 },
					{ date: undefined, value: 10 },
					{ dateString: '2023-03-20', value: 20 },
				],
			},
		];

		const { result } = renderHook( () => useChartDataTransform( mockData ) );

		expect( result.current[ 0 ].data ).toHaveLength( 3 );
		// Points with undefined dates should remain in their original position
		expect( result.current[ 0 ].data[ 1 ].value ).toBe( 10 );
	} );

	it( 'should preserve series metadata', () => {
		const mockData: SeriesData[] = [
			{
				label: 'Series 1',
				options: { stroke: '#ff0000' },
				data: [
					{ dateString: '2023-03-15', value: 15 },
					{ dateString: '2023-03-10', value: 10 },
				],
			},
		];

		const { result } = renderHook( () => useChartDataTransform( mockData ) );

		expect( result.current[ 0 ].label ).toBe( 'Series 1' );
		expect( result.current[ 0 ].options ).toEqual( { stroke: '#ff0000' } );
	} );
} );
