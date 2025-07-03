import { render } from '@testing-library/react';
import { ChartProvider, useChartContext } from './chart-context';
import { useChartId, useChartRegistration } from './utils';
import type { ChartContextValue } from './types';
import type { BaseLegendItem } from '../../components/legend/types';
import type { ChartTheme } from '../../types';

describe( 'ChartContext', () => {
	const mockLegendItems: BaseLegendItem[] = [
		{ label: 'Series 1', value: '100', color: '#ff0000' },
		{ label: 'Series 2', value: '200', color: '#00ff00' },
	];

	const mockTheme: ChartTheme = {
		backgroundColor: '#ffffff',
		colors: [ '#ff0000', '#00ff00', '#0000ff' ],
		tickLength: 8,
		gridColor: '#e0e0e0',
		gridColorDark: '#333333',
	};

	describe( 'ChartProvider', () => {
		it( 'provides context to child components', () => {
			let contextValue: ChartContextValue;

			const TestComponent = () => {
				contextValue = useChartContext();
				return <div>Test</div>;
			};

			render(
				<ChartProvider>
					<TestComponent />
				</ChartProvider>
			);

			expect( contextValue ).toBeDefined();
			expect( contextValue.registerChart ).toBeInstanceOf( Function );
			expect( contextValue.unregisterChart ).toBeInstanceOf( Function );
			expect( contextValue.getChartData ).toBeInstanceOf( Function );
			expect( contextValue.charts ).toBeInstanceOf( Map );
		} );

		it( 'throws error when useChartContext is used outside provider', () => {
			const TestComponent = () => {
				useChartContext();
				return <div>Test</div>;
			};

			// Suppress console.error for this test
			const consoleSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );

			expect( () => {
				render( <TestComponent /> );
			} ).toThrow( 'useChartContext must be used within a ChartProvider' );

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
				contextValue = useChartContext();

				useChartRegistration( chartId, mockLegendItems, mockTheme, 'bar', { test: true } );

				return <div>Test</div>;
			};

			render(
				<ChartProvider>
					<TestComponent />
				</ChartProvider>
			);

			const chartData = contextValue.getChartData( 'test-chart' );
			expect( chartData ).toEqual( {
				legendItems: mockLegendItems,
				theme: mockTheme,
				chartType: 'bar',
				metadata: { test: true },
			} );
		} );

		it( 'supports multiple independent charts', () => {
			let contextValue: ChartContextValue;

			const TestComponent = () => {
				const chartId1 = useChartId( 'chart-1' );
				const chartId2 = useChartId( 'chart-2' );
				contextValue = useChartContext();

				useChartRegistration( chartId1, mockLegendItems, mockTheme, 'bar' );
				useChartRegistration( chartId2, mockLegendItems, mockTheme, 'line' );

				return <div>Test</div>;
			};

			render(
				<ChartProvider>
					<TestComponent />
				</ChartProvider>
			);

			expect( contextValue.charts.size ).toBe( 2 );
			expect( contextValue.getChartData( 'chart-1' )?.chartType ).toBe( 'bar' );
			expect( contextValue.getChartData( 'chart-2' )?.chartType ).toBe( 'line' );
		} );

		it( 'returns undefined for non-existent charts', () => {
			let contextValue: ChartContextValue;

			const TestComponent = () => {
				contextValue = useChartContext();
				return <div>Test</div>;
			};

			render(
				<ChartProvider>
					<TestComponent />
				</ChartProvider>
			);

			expect( contextValue.getChartData( 'non-existent' ) ).toBeUndefined();
		} );

		it( 'handles chart ID collisions by overwriting', () => {
			let contextValue: ChartContextValue;

			const TestComponent = () => {
				const chartId = useChartId( 'same-id' );
				contextValue = useChartContext();

				// Register first chart
				useChartRegistration( chartId, mockLegendItems, mockTheme, 'bar' );
				// Register second chart with same ID
				useChartRegistration( chartId, mockLegendItems, mockTheme, 'line' );

				return <div>Test</div>;
			};

			render(
				<ChartProvider>
					<TestComponent />
				</ChartProvider>
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
				const context = useChartContext();
				functionRefs.push( {
					registerChart: context.registerChart,
					unregisterChart: context.unregisterChart,
					getChartData: context.getChartData,
				} );
				return <div>Test</div>;
			};

			const { rerender } = render(
				<ChartProvider>
					<TestComponent />
				</ChartProvider>
			);

			rerender(
				<ChartProvider>
					<TestComponent />
				</ChartProvider>
			);

			expect( functionRefs ).toHaveLength( 2 );
			expect( functionRefs[ 0 ].registerChart ).toBe( functionRefs[ 1 ].registerChart );
			expect( functionRefs[ 0 ].unregisterChart ).toBe( functionRefs[ 1 ].unregisterChart );
			expect( functionRefs[ 0 ].getChartData ).toBe( functionRefs[ 1 ].getChartData );
		} );
	} );
} );
