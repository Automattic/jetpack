import { renderHook } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../../providers';
import { useChartLegendItems } from '../use-chart-legend-items';
import type { DataPointPercentageCalculated, DataPointDate, SeriesData } from '../../../../types';
import type { ReactNode } from 'react';

// Wrapper component to provide GlobalChartsProvider context
const wrapper = ( { children }: { children: ReactNode } ) => (
	<GlobalChartsProvider>{ children }</GlobalChartsProvider>
);

describe( 'useChartLegendItems', () => {
	describe( 'Number Formatting (i18n)', () => {
		describe( 'DataPointPercentageCalculated', () => {
			const percentageData: DataPointPercentageCalculated[] = [
				{ label: 'Item 1', value: 80000, percentage: 60.6 },
				{ label: 'Item 2', value: 30000, percentage: 22.7 },
				{ label: 'Item 3', value: 22000, percentage: 16.7 },
			];

			test( 'formats percentage values by default', () => {
				const { result } = renderHook(
					() =>
						useChartLegendItems( percentageData, {
							showValues: true,
							legendValueDisplay: 'percentage',
						} ),
					{ wrapper }
				);

				expect( result.current[ 0 ].value ).toBe( '60.6%' );
				expect( result.current[ 1 ].value ).toBe( '22.7%' );
				expect( result.current[ 2 ].value ).toBe( '16.7%' );
			} );

			test( 'formats numeric values with localization when legendValueDisplay is "value"', () => {
				const { result } = renderHook(
					() =>
						useChartLegendItems( percentageData, {
							showValues: true,
							legendValueDisplay: 'value',
						} ),
					{ wrapper }
				);

				// Values should be formatted with thousand separators
				expect( result.current[ 0 ].value ).toBe( '80,000' );
				expect( result.current[ 1 ].value ).toBe( '30,000' );
				expect( result.current[ 2 ].value ).toBe( '22,000' );
			} );

			test( 'uses valueDisplay when provided, falling back to formatted value', () => {
				const dataWithDisplay: DataPointPercentageCalculated[] = [
					{ label: 'Item 1', value: 80000, percentage: 60, valueDisplay: 'Custom 80K' },
					{ label: 'Item 2', value: 30000, percentage: 30 },
				];

				const { result } = renderHook(
					() =>
						useChartLegendItems( dataWithDisplay, {
							showValues: true,
							legendValueDisplay: 'valueDisplay',
						} ),
					{ wrapper }
				);

				// First item uses custom valueDisplay
				expect( result.current[ 0 ].value ).toBe( 'Custom 80K' );
				// Second item falls back to formatted value
				expect( result.current[ 1 ].value ).toBe( '30,000' );
			} );

			test( 'returns empty string when legendValueDisplay is "none"', () => {
				const { result } = renderHook(
					() =>
						useChartLegendItems( percentageData, {
							showValues: true,
							legendValueDisplay: 'none',
						} ),
					{ wrapper }
				);

				expect( result.current[ 0 ].value ).toBe( '' );
				expect( result.current[ 1 ].value ).toBe( '' );
				expect( result.current[ 2 ].value ).toBe( '' );
			} );

			test( 'returns empty string when showValues is false', () => {
				const { result } = renderHook(
					() =>
						useChartLegendItems( percentageData, {
							showValues: false,
							legendValueDisplay: 'value',
						} ),
					{ wrapper }
				);

				expect( result.current[ 0 ].value ).toBe( '' );
				expect( result.current[ 1 ].value ).toBe( '' );
				expect( result.current[ 2 ].value ).toBe( '' );
			} );
		} );

		describe( 'DataPointDate (time series)', () => {
			const dateData: DataPointDate[] = [
				{ date: new Date( '2024-01-01' ), value: 1234.56, label: 'Jan' },
				{ date: new Date( '2024-02-01' ), value: 5000, label: 'Feb' },
				{ date: new Date( '2024-03-01' ), value: null, label: 'Mar' },
			];

			test( 'formats numeric values with localization', () => {
				const { result } = renderHook(
					() =>
						useChartLegendItems( dateData, {
							showValues: true,
						} ),
					{ wrapper }
				);

				// Values should be formatted with thousand separators (decimals are rounded by default)
				expect( result.current[ 0 ].value ).toBe( '1,235' );
				expect( result.current[ 1 ].value ).toBe( '5,000' );
			} );

			test( 'handles null values gracefully', () => {
				const { result } = renderHook(
					() =>
						useChartLegendItems( dateData, {
							showValues: true,
						} ),
					{ wrapper }
				);

				// Null value should return empty string
				expect( result.current[ 2 ].value ).toBe( '' );
			} );
		} );

		describe( 'SeriesData', () => {
			const seriesData: SeriesData[] = [
				{
					label: 'Series 1',
					data: [
						{ date: new Date( '2024-01-01' ), value: 100 },
						{ date: new Date( '2024-01-02' ), value: 200 },
						{ date: new Date( '2024-01-03' ), value: 150 },
					],
				},
				{
					label: 'Series 2',
					data: [
						{ date: new Date( '2024-01-01' ), value: 80 },
						{ date: new Date( '2024-01-02' ), value: 90 },
					],
				},
			];

			test( 'returns data length as value for series data when showValues is true', () => {
				const { result } = renderHook(
					() =>
						useChartLegendItems( seriesData, {
							showValues: true,
						} ),
					{ wrapper }
				);

				// For series data, value is the count of data points
				expect( result.current[ 0 ].value ).toBe( '3' );
				expect( result.current[ 1 ].value ).toBe( '2' );
			} );

			test( 'returns empty string when showValues is false', () => {
				const { result } = renderHook(
					() =>
						useChartLegendItems( seriesData, {
							showValues: false,
						} ),
					{ wrapper }
				);

				expect( result.current[ 0 ].value ).toBe( '' );
				expect( result.current[ 1 ].value ).toBe( '' );
			} );
		} );
	} );

	describe( 'Edge Cases', () => {
		test( 'handles empty data array', () => {
			const { result } = renderHook( () => useChartLegendItems( [], { showValues: true } ), {
				wrapper,
			} );

			expect( result.current ).toEqual( [] );
		} );

		test( 'handles data with zero values', () => {
			const zeroData: DataPointPercentageCalculated[] = [
				{ label: 'Zero Value', value: 0, percentage: 0 },
			];

			const { result } = renderHook(
				() =>
					useChartLegendItems( zeroData, {
						showValues: true,
						legendValueDisplay: 'value',
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].value ).toBe( '0' );
		} );

		test( 'handles very large numbers', () => {
			const largeData: DataPointPercentageCalculated[] = [
				{ label: 'Large', value: 1234567890, percentage: 100 },
			];

			const { result } = renderHook(
				() =>
					useChartLegendItems( largeData, {
						showValues: true,
						legendValueDisplay: 'value',
					} ),
				{ wrapper }
			);

			// Should format with thousand separators
			expect( result.current[ 0 ].value ).toBe( '1,234,567,890' );
		} );

		test( 'handles decimal values', () => {
			const decimalData: DataPointPercentageCalculated[] = [
				{ label: 'Decimal', value: 1234.5678, percentage: 100 },
			];

			const { result } = renderHook(
				() =>
					useChartLegendItems( decimalData, {
						showValues: true,
						legendValueDisplay: 'value',
					} ),
				{ wrapper }
			);

			// Should format with thousand separators (decimals are rounded by default)
			expect( result.current[ 0 ].value ).toBe( '1,235' );
		} );
	} );

	describe( 'Label and Color', () => {
		test( 'preserves label and color from data', () => {
			const data: DataPointPercentageCalculated[] = [
				{ label: 'Test Label', value: 100, percentage: 100 },
			];

			const { result } = renderHook(
				() =>
					useChartLegendItems( data, {
						showValues: true,
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].label ).toBe( 'Test Label' );
			expect( result.current[ 0 ].color ).toBeDefined();
		} );
	} );
} );
