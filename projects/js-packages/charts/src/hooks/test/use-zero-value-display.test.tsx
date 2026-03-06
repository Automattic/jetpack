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

	test( 'adds visualValue for zero values when enabled', () => {
		const { result } = renderHook( () =>
			useZeroValueDisplay( mockData, { enabled: true, valueAxisLength: 100 } )
		);

		const enhancedData = result.current;
		expect( enhancedData ).not.toBe( mockData );
		expect( enhancedData[ 0 ].data[ 0 ] ).toHaveProperty( 'visualValue' );
		expect(
			( enhancedData[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue
		).toBeGreaterThan( 0 );
	} );

	test( 'does not add visualValue for non-zero values', () => {
		const { result } = renderHook( () =>
			useZeroValueDisplay( mockData, { enabled: true, valueAxisLength: 100 } )
		);

		const enhancedData = result.current;
		expect( enhancedData[ 0 ].data[ 1 ] ).not.toHaveProperty( 'visualValue' );
		expect( enhancedData[ 0 ].data[ 2 ] ).not.toHaveProperty( 'visualValue' );
	} );

	test( 'calculates visualValue as 3px equivalent, capped at min value', () => {
		// mockData has values [0, 100, 200]
		// pixelBasedValue = (3 / 100) * 200 = 6
		// But min non-zero value is 100, so visualValue = min(6, 100) = 6
		const { result } = renderHook( () =>
			useZeroValueDisplay( mockData, { enabled: true, valueAxisLength: 100 } )
		);

		const visualValue = ( result.current[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue;
		expect( visualValue ).toBe( 6 );
	} );

	test( 'caps visualValue at smallest non-zero value', () => {
		// When 3px equivalent would exceed the smallest bar, cap it
		const data: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'A', value: 0 },
					{ label: 'B', value: 2 }, // small value
					{ label: 'C', value: 100 },
				],
			},
		];

		// pixelBasedValue = (3 / 100) * 100 = 3
		// minAbsoluteValue = 2
		// visualValue = min(3, 2) = 2 (capped so zero doesn't exceed smallest bar)
		const { result } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 100 } )
		);

		const visualValue = ( result.current[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue;
		expect( visualValue ).toBe( 2 );
	} );

	test( 'scales visualValue based on axis length', () => {
		const data: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'A', value: 0 },
					{ label: 'B', value: 100 },
				],
			},
		];

		// Small axis = larger pixelBasedValue, but capped at minValue (100)
		const { result: smallAxis } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 50 } )
		);
		// Large axis = smaller visualValue
		const { result: largeAxis } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 200 } )
		);

		const smallAxisValue = ( smallAxis.current[ 0 ].data[ 0 ] as { visualValue?: number } )
			.visualValue;
		const largeAxisValue = ( largeAxis.current[ 0 ].data[ 0 ] as { visualValue?: number } )
			.visualValue;

		// 3/50 * 100 = 6, but capped at 100 (only non-zero value) → 6
		// 3/200 * 100 = 1.5, capped at 100 → 1.5
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

		// Should return original data since there are no non-zero values
		expect( result.current ).toBe( zeroOnlyData );
	} );
} );
