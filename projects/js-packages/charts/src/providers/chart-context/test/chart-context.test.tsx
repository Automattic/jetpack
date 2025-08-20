import { render } from '@testing-library/react';
import { useMemo } from 'react';
import { GlobalChartsProvider, useGlobalChartsContext } from '../global-charts-provider';
import { useChartId, useChartRegistration } from '../utils';
import type { BaseLegendItem } from '../../../components/legend/types';
import type { ChartContextValue } from '../types';

describe( 'ChartContext', () => {
	const mockLegendItems: BaseLegendItem[] = [
		{ label: 'Series 1', value: '100', color: '#ff0000' },
		{ label: 'Series 2', value: '200', color: '#00ff00' },
	];

	describe( 'GlobalChartsProvider', () => {
		it( 'provides context to child components', () => {
			let contextValue: ChartContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			expect( contextValue ).toBeDefined();
			expect( contextValue.registerChart ).toBeInstanceOf( Function );
			expect( contextValue.unregisterChart ).toBeInstanceOf( Function );
			expect( contextValue.getChartData ).toBeInstanceOf( Function );
			expect( contextValue.charts ).toBeInstanceOf( Map );
		} );

		it( 'throws error when useGlobalChartsContext is used outside provider', () => {
			const TestComponent = () => {
				useGlobalChartsContext();
				return <div>Test</div>;
			};

			// Suppress console.error for this test
			const consoleSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );

			expect( () => {
				render( <TestComponent /> );
			} ).toThrow( 'useGlobalChartsContext must be used within a GlobalChartsProvider' );

			consoleSpy.mockRestore();
		} );
	} );

	describe( 'useChartId', () => {
		it( 'uses provided chartId when available', () => {
			let resolvedId: string;

			const TestComponent = () => {
				resolvedId = useChartId( 'custom-chart-id' );
				return <div>Test</div>;
			};

			render( <TestComponent /> );

			expect( resolvedId ).toBe( 'custom-chart-id' );
		} );

		it( 'generates unique ID when chartId is not provided', () => {
			const resolvedIds: string[] = [];

			const TestComponent = ( { index }: { index: number } ) => {
				const id = useChartId();
				resolvedIds[ index ] = id;
				return <div>Test { index }</div>;
			};

			render(
				<div>
					<TestComponent index={ 0 } />
					<TestComponent index={ 1 } />
				</div>
			);

			expect( resolvedIds ).toHaveLength( 2 );
			expect( resolvedIds[ 0 ] ).toBeTruthy();
			expect( resolvedIds[ 1 ] ).toBeTruthy();
			expect( resolvedIds[ 0 ] ).not.toBe( resolvedIds[ 1 ] );
		} );
	} );

	describe( 'Chart registration', () => {
		it( 'registers and retrieves chart data correctly', () => {
			let contextValue: ChartContextValue;

			const TestComponent = () => {
				const chartId = useChartId( 'test-chart' );
				contextValue = useGlobalChartsContext();

				// Memoize metadata to prevent infinite loop
				const metadata = useMemo( () => ( { test: true } ), [] );
				useChartRegistration( {
					chartId,
					legendItems: mockLegendItems,
					chartType: 'bar',
					isDataValid: true,
					metadata,
				} );

				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const chartData = contextValue.getChartData( 'test-chart' );
			expect( chartData ).toEqual( {
				legendItems: mockLegendItems,
				chartType: 'bar',
				metadata: { test: true },
			} );
		} );

		it( 'supports multiple independent charts', () => {
			let contextValue: ChartContextValue;

			const TestComponent = () => {
				const chartId1 = useChartId( 'chart-1' );
				const chartId2 = useChartId( 'chart-2' );
				contextValue = useGlobalChartsContext();

				useChartRegistration( {
					chartId: chartId1,
					legendItems: mockLegendItems,
					chartType: 'bar',
					isDataValid: true,
				} );
				useChartRegistration( {
					chartId: chartId2,
					legendItems: mockLegendItems,
					chartType: 'line',
					isDataValid: true,
				} );

				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			expect( contextValue.charts.size ).toBe( 2 );
			expect( contextValue.getChartData( 'chart-1' )?.chartType ).toBe( 'bar' );
			expect( contextValue.getChartData( 'chart-2' )?.chartType ).toBe( 'line' );
		} );

		it( 'returns undefined for non-existent charts', () => {
			let contextValue: ChartContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			expect( contextValue.getChartData( 'non-existent' ) ).toBeUndefined();
		} );

		it( 'handles chart ID collisions by overwriting', () => {
			let contextValue: ChartContextValue;

			const TestComponent = () => {
				const chartId = useChartId( 'same-id' );
				contextValue = useGlobalChartsContext();

				// Register first chart
				useChartRegistration( {
					chartId,
					legendItems: mockLegendItems,
					chartType: 'bar',
					isDataValid: true,
				} );
				// Register second chart with same ID
				useChartRegistration( {
					chartId,
					legendItems: mockLegendItems,
					chartType: 'line',
					isDataValid: true,
				} );

				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			expect( contextValue.charts.size ).toBe( 1 );
			expect( contextValue.getChartData( 'same-id' )?.chartType ).toBe( 'line' );
		} );
	} );

	describe( 'Context stability', () => {
		it( 'maintains stable function references', () => {
			const functionRefs: Array< {
				registerChart: ChartContextValue[ 'registerChart' ];
				unregisterChart: ChartContextValue[ 'unregisterChart' ];
				getChartData: ChartContextValue[ 'getChartData' ];
			} > = [];

			const TestComponent = () => {
				const context = useGlobalChartsContext();
				functionRefs.push( {
					registerChart: context.registerChart,
					unregisterChart: context.unregisterChart,
					getChartData: context.getChartData,
				} );
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			expect( functionRefs ).toHaveLength( 2 );
			expect( functionRefs[ 0 ].registerChart ).toBe( functionRefs[ 1 ].registerChart );
			expect( functionRefs[ 0 ].unregisterChart ).toBe( functionRefs[ 1 ].unregisterChart );
			expect( functionRefs[ 0 ].getChartData ).toBe( functionRefs[ 1 ].getChartData );
		} );
	} );
} );
