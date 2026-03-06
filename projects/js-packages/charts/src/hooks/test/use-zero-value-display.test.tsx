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
					{ label: 'A', value: 1 }, // Would render as 1px (below 2px minimum)
					{ label: 'B', value: 100 },
				],
			},
		];

		// With axis=100 and max=100, 2px threshold = 2
		// Value of 1 < 2, so it gets boosted
		const { result } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 100 } )
		);

		const enhancedData = result.current;
		expect( enhancedData[ 0 ].data[ 0 ] ).toHaveProperty( 'visualValue' );
		expect( ( enhancedData[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue ).toBe( 2 );
	} );

	test( 'does not add visualValue for values above minimum threshold', () => {
		const data: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'A', value: 10 }, // Would render as 10px (above 2px minimum)
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

	test( 'zero values get 1px equivalent (1px less than near-zero)', () => {
		// mockData has values [0, 100, 200], max = 200
		// zeroVisualValue = (1 / 100) * 200 = 2
		const { result } = renderHook( () =>
			useZeroValueDisplay( mockData, { enabled: true, valueAxisLength: 100 } )
		);

		const visualValue = ( result.current[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue;
		expect( visualValue ).toBe( 2 ); // 1px equivalent
	} );

	test( 'near-zero values get 2px equivalent', () => {
		const data: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'A', value: 1 }, // Would render as 1px
					{ label: 'B', value: 100 },
				],
			},
		];

		// minNonZeroValue = (2 / 100) * 100 = 2
		const { result } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 100 } )
		);

		const visualValue = ( result.current[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue;
		expect( visualValue ).toBe( 2 ); // 2px equivalent
	} );

	test( 'zeros and near-zeros have 1px visual difference', () => {
		const data: SeriesData[] = [
			{
				label: 'Series 1',
				data: [
					{ label: 'Zero', value: 0 },
					{ label: 'NearZero', value: 1 },
					{ label: 'Max', value: 100 },
				],
			},
		];

		const { result } = renderHook( () =>
			useZeroValueDisplay( data, { enabled: true, valueAxisLength: 100 } )
		);

		const zeroVisual = ( result.current[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue;
		const nearZeroVisual = ( result.current[ 0 ].data[ 1 ] as { visualValue?: number } )
			.visualValue;

		// Zero = 1px equivalent (1), near-zero = 2px equivalent (2)
		expect( zeroVisual ).toBe( 1 );
		expect( nearZeroVisual ).toBe( 2 );
		expect( nearZeroVisual! - zeroVisual! ).toBe( 1 ); // 1px difference
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
