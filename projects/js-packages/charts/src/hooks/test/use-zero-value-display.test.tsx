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
		const { result } = renderHook( () => useZeroValueDisplay( mockData, { enabled: false } ) );
		expect( result.current ).toBe( mockData );
	} );

	test( 'adds visualValue for zero values when enabled', () => {
		const { result } = renderHook( () => useZeroValueDisplay( mockData, { enabled: true } ) );

		const enhancedData = result.current;
		expect( enhancedData ).not.toBe( mockData );
		expect( enhancedData[ 0 ].data[ 0 ] ).toHaveProperty( 'visualValue' );
		expect(
			( enhancedData[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue
		).toBeGreaterThan( 0 );
	} );

	test( 'does not add visualValue for non-zero values', () => {
		const { result } = renderHook( () => useZeroValueDisplay( mockData, { enabled: true } ) );

		const enhancedData = result.current;
		expect( enhancedData[ 0 ].data[ 1 ] ).not.toHaveProperty( 'visualValue' );
		expect( enhancedData[ 0 ].data[ 2 ] ).not.toHaveProperty( 'visualValue' );
	} );

	describe( 'chartHeight-based minimum visibility', () => {
		test( 'ensures minimum pixel height when chartHeight is provided', () => {
			// With a small chart height, the pixel-based calculation should
			// result in a larger visualValue than the ratio-based calculation
			const dataWithLargeRange: SeriesData[] = [
				{
					label: 'Series 1',
					data: [
						{ label: 'A', value: 0 },
						{ label: 'B', value: 10000 },
					],
				},
			];

			const { result: withoutHeight } = renderHook( () =>
				useZeroValueDisplay( dataWithLargeRange, { enabled: true } )
			);

			const { result: withSmallHeight } = renderHook( () =>
				useZeroValueDisplay( dataWithLargeRange, { enabled: true, chartHeight: 50 } )
			);

			const visualValueWithoutHeight = (
				withoutHeight.current[ 0 ].data[ 0 ] as { visualValue?: number }
			 ).visualValue;
			const visualValueWithSmallHeight = (
				withSmallHeight.current[ 0 ].data[ 0 ] as { visualValue?: number }
			 ).visualValue;

			// With small chart height, the pixel-based minimum should be larger
			expect( visualValueWithSmallHeight ).toBeGreaterThan( visualValueWithoutHeight! );
		} );

		test( 'calculates minimum visible value based on MIN_PIXEL_HEIGHT', () => {
			const data: SeriesData[] = [
				{
					label: 'Series 1',
					data: [
						{ label: 'A', value: 0 },
						{ label: 'B', value: 100 },
					],
				},
			];

			// With chartHeight=100 and maxValue=100:
			// minPixelBasedValue = (3 / 100) * 100 = 3
			const { result } = renderHook( () =>
				useZeroValueDisplay( data, { enabled: true, chartHeight: 100 } )
			);

			const visualValue = ( result.current[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue;

			// The visualValue should be at least 3% of the max value (100 * 0.03 = 3)
			// to ensure 3 pixels in a 100px chart
			expect( visualValue ).toBeGreaterThanOrEqual( 3 );
		} );

		test( 'uses ratio-based calculation when it produces larger value', () => {
			const data: SeriesData[] = [
				{
					label: 'Series 1',
					data: [
						{ label: 'A', value: 0 },
						{ label: 'B', value: 10 },
					],
				},
			];

			// With chartHeight=1000 and maxValue=10:
			// minPixelBasedValue = (3 / 1000) * 10 = 0.03
			// ratioBasedValue = min(10 * 0.6, 10 * 0.008) = min(6, 0.08) = 0.08
			// Result should be max(0.03, 0.08) = 0.08 (ratio-based wins)
			const { result } = renderHook( () =>
				useZeroValueDisplay( data, { enabled: true, chartHeight: 1000 } )
			);

			const visualValue = ( result.current[ 0 ].data[ 0 ] as { visualValue?: number } ).visualValue;

			// Ratio-based calculation: min(10 * 0.6, 10 * 0.008) = 0.08
			expect( visualValue ).toBeCloseTo( 0.08, 2 );
		} );
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

		const { result } = renderHook( () => useZeroValueDisplay( zeroOnlyData, { enabled: true } ) );

		// Should return original data since there are no non-zero values to base the calculation on
		expect( result.current ).toBe( zeroOnlyData );
	} );
} );
