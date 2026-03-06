import { renderHook } from '@testing-library/react';
import { useZeroValueDisplay } from '../use-zero-value-display';
import type { SeriesData } from '../../types';

describe( 'useZeroValueDisplay', () => {
	const mockData: SeriesData[] = [
		{
			label: 'Series 1',
			data: [
				{ label: 'A', value: 0 },
				{ label: 'B', value: 100 },
				{ label: 'C', value: 200 },
			],
		},
	];

	test( 'returns original data when disabled', () => {
		const { result } = renderHook( () =>
			useZeroValueDisplay( mockData, { enabled: false, valueAxisLength: 100 } )
		);
		expect( result.current ).toBe( mockData );
	} );

	test( 'returns original data when valueAxisLength is not provided', () => {
		const { result } = renderHook( () => useZeroValueDisplay( mockData, { enabled: true } ) );
		expect( result.current ).toBe( mockData );
	} );

	test( 'adds visualValue for zero values', () => {
		const { result } = renderHook( () =>
			useZeroValueDisplay( mockData, { enabled: true, valueAxisLength: 100 } )
		);

		const enhancedData = result.current;
		expect( enhancedData[ 0 ].data[ 0 ] ).toHaveProperty( 'visualValue' );
		expect(
			( enhancedData[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue
		).toBeGreaterThan( 0 );
	} );

	test( 'adds visualValue for near-zero values that would render below minimum', () => {
		const data: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'A', value: 1 }, // Would render as 1px (below 3px minimum)
					{ label: 'B', value: 100 },
				],
			},
		];

		// With axis=100 and max=100, 3px threshold = 3
		// Value of 1 < 3, so it gets boosted
		const { result } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 100 } )
		);

		const enhancedData = result.current;
		expect( enhancedData[ 0 ].data[ 0 ] ).toHaveProperty( 'visualValue' );
		expect( ( enhancedData[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue ).toBe( 3 );
	} );

	test( 'does not add visualValue for values above minimum threshold', () => {
		const data: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'A', value: 10 }, // Would render as 10px (above 3px minimum)
					{ label: 'B', value: 100 },
				],
			},
		];

		const { result } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 100 } )
		);

		const enhancedData = result.current;
		expect( enhancedData[ 0 ].data[ 0 ] ).not.toHaveProperty( 'visualValue' );
		expect( enhancedData[ 0 ].data[ 1 ] ).not.toHaveProperty( 'visualValue' );
	} );

	test( 'calculates visualValue as 3px equivalent', () => {
		// mockData has values [0, 100, 200], max = 200
		// minVisibleValue = (3 / 100) * 200 = 6
		const { result } = renderHook( () =>
			useZeroValueDisplay( mockData, { enabled: true, valueAxisLength: 100 } )
		);

		const visualValue = ( result.current[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue;
		expect( visualValue ).toBe( 6 );
	} );

	test( 'scales minVisibleValue based on axis length', () => {
		const data: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'A', value: 0 },
					{ label: 'B', value: 100 },
				],
			},
		];

		// Small axis = larger minVisibleValue (to ensure 3px)
		const { result: smallAxis } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 50 } )
		);
		// Large axis = smaller minVisibleValue
		const { result: largeAxis } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 200 } )
		);

		const smallAxisValue = ( smallAxis.current[ 0 ].data[ 0 ] as { visualValue?: number } )
			.visualValue;
		const largeAxisValue = ( largeAxis.current[ 0 ].data[ 0 ] as { visualValue?: number } )
			.visualValue;

		// 3/50 * 100 = 6 vs 3/200 * 100 = 1.5
		expect( smallAxisValue ).toBe( 6 );
		expect( largeAxisValue ).toBe( 1.5 );
	} );

	test( 'handles data with only zero values', () => {
		const zeroOnlyData: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'A', value: 0 },
					{ label: 'B', value: 0 },
				],
			},
		];

		const { result } = renderHook( () =>
			useZeroValueDisplay( zeroOnlyData, { enabled: true, valueAxisLength: 100 } )
		);

		// Should return original data since there are no non-zero values to calculate from
		expect( result.current ).toBe( zeroOnlyData );
	} );
} );
