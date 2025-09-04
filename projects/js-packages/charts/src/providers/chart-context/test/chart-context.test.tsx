import { render } from '@testing-library/react';
import { useMemo } from 'react';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useChartId } from '../hooks/use-chart-id';
import { useChartRegistration } from '../hooks/use-chart-registration';
import { useGlobalChartsContext } from '../hooks/use-global-charts-context';
import type { BaseLegendItem } from '../../../components/legend';
import type { ChartTheme } from '../../../types';
import type { GlobalChartsContextValue } from '../types';

describe( 'ChartContext', () => {
	const mockTheme: ChartTheme = {
		colors: [ '#ff0000', '#00ff00', '#0000ff' ],
	} as ChartTheme;

	const mockLegendItems: BaseLegendItem[] = [
		{ label: 'Series 1', value: '100', color: '#ff0000' },
		{ label: 'Series 2', value: '200', color: '#00ff00' },
	];

	describe( 'GlobalChartsProvider', () => {
		it( 'provides context to child components', () => {
			let contextValue: GlobalChartsContextValue;

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
			let contextValue: GlobalChartsContextValue;

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
			let contextValue: GlobalChartsContextValue;

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
			let contextValue: GlobalChartsContextValue;

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
			let contextValue: GlobalChartsContextValue;

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

	describe( 'Group Color Resolver', () => {
		it( 'provides resolveGroupColor function', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			expect( contextValue.resolveGroupColor ).toBeInstanceOf( Function );
		} );

		it( 'returns consistent colors for same group across different indices', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const color1 = contextValue.resolveGroupColor( { group: 'united-states', index: 0 } );
			const color2 = contextValue.resolveGroupColor( { group: 'united-states', index: 5 } );
			const color3 = contextValue.resolveGroupColor( { group: 'united-states', index: 10 } );

			expect( color1 ).toBe( color2 );
			expect( color2 ).toBe( color3 );
		} );

		it( 'returns different colors for different groups', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const usColor = contextValue.resolveGroupColor( { group: 'united-states', index: 0 } );
			const gbColor = contextValue.resolveGroupColor( { group: 'great-britain', index: 0 } );
			const jpColor = contextValue.resolveGroupColor( { group: 'japan', index: 0 } );

			expect( usColor ).not.toBe( gbColor );
			expect( gbColor ).not.toBe( jpColor );
			expect( usColor ).not.toBe( jpColor );
		} );

		it( 'respects overrideColor when provided', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const overrideColor = '#ff6600';
			const colorWithOverride = contextValue.resolveGroupColor( {
				group: 'united-states',
				index: 0,
				overrideColor,
			} );
			const colorWithoutOverride = contextValue.resolveGroupColor( {
				group: 'united-states',
				index: 0,
			} );

			expect( colorWithOverride ).toBe( overrideColor );
			expect( colorWithoutOverride ).not.toBe( overrideColor );
		} );

		it( 'handles undefined group gracefully', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const color = contextValue.resolveGroupColor( { group: undefined, index: 0 } );

			expect( color ).toBe( mockTheme.colors[ 0 ] );
		} );

		it( 'handles empty string group gracefully', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const color = contextValue.resolveGroupColor( { group: '', index: 0 } );

			expect( color ).toBe( mockTheme.colors[ 0 ] );
		} );

		it( 'falls back to theme colors by index when group is invalid', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const color1 = contextValue.resolveGroupColor( { group: undefined, index: 0 } );
			const color2 = contextValue.resolveGroupColor( { group: '', index: 1 } );
			const color3 = contextValue.resolveGroupColor( {
				group: null as string | undefined,
				index: 2,
			} );

			expect( color1 ).toBe( mockTheme.colors[ 0 ] );
			expect( color2 ).toBe( mockTheme.colors[ 1 ] );
			expect( color3 ).toBe( mockTheme.colors[ 2 ] );
		} );

		it( 'wraps around theme colors when index exceeds theme color array', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// mockTheme has 3 colors, so index 3 should wrap to index 0
			const color1 = contextValue.resolveGroupColor( { group: undefined, index: 3 } );
			const color2 = contextValue.resolveGroupColor( { group: undefined, index: 0 } );

			expect( color1 ).toBe( color2 );
			expect( color1 ).toBe( mockTheme.colors[ 0 ] );
		} );

		it( 'maintains color stability when same group accessed multiple times', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const groupName = 'consistent-group';
			const colors = [];

			// Call resolveGroupColor multiple times for the same group
			for ( let i = 0; i < 10; i++ ) {
				colors.push( contextValue.resolveGroupColor( { group: groupName, index: i } ) );
			}

			// All colors should be the same
			const firstColor = colors[ 0 ];
			colors.forEach( color => {
				expect( color ).toBe( firstColor );
			} );
		} );

		it( 'overrideColor takes precedence over group-based colors', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const groupName = 'test-group';
			const overrideColor = '#purple';

			const groupColor = contextValue.resolveGroupColor( { group: groupName, index: 0 } );
			const overriddenColor = contextValue.resolveGroupColor( {
				group: groupName,
				index: 0,
				overrideColor,
			} );

			expect( groupColor ).not.toBe( overrideColor );
			expect( overriddenColor ).toBe( overrideColor );
		} );

		it( 'maintains color stability when groups are removed from chart', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Simulate initial chart with 3 groups at different indices
			const initialGroups = [
				{ group: 'united-states', index: 0 },
				{ group: 'great-britain', index: 1 },
				{ group: 'japan', index: 2 },
			];

			// Get initial colors for all groups
			const initialColors = initialGroups.map( ( { group, index } ) =>
				contextValue.resolveGroupColor( { group, index } )
			);

			// Simulate removing the middle group (great-britain)
			// Now united-states is at index 0, japan is at index 1
			const filteredGroups = [
				{ group: 'united-states', index: 0 },
				{ group: 'japan', index: 1 }, // Note: index changed from 2 to 1
			];

			// Get colors after "filtering"
			const filteredColors = filteredGroups.map( ( { group, index } ) =>
				contextValue.resolveGroupColor( { group, index } )
			);

			// Colors should remain the same despite index changes
			expect( filteredColors[ 0 ] ).toBe( initialColors[ 0 ] ); // united-states: same color
			expect( filteredColors[ 1 ] ).toBe( initialColors[ 2 ] ); // japan: same color

			// Verify that the colors are indeed different from each other
			expect( filteredColors[ 0 ] ).not.toBe( filteredColors[ 1 ] );
		} );

		it( 'maintains color stability when groups are re-added to chart', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Get initial colors for all groups
			const usColor1 = contextValue.resolveGroupColor( { group: 'united-states', index: 0 } );
			const gbColor1 = contextValue.resolveGroupColor( { group: 'great-britain', index: 1 } );
			const jpColor1 = contextValue.resolveGroupColor( { group: 'japan', index: 2 } );

			// Simulate removing great-britain (only US and Japan visible)
			const usColor2 = contextValue.resolveGroupColor( { group: 'united-states', index: 0 } );
			const jpColor2 = contextValue.resolveGroupColor( { group: 'japan', index: 1 } );

			// Simulate re-adding great-britain back (all groups visible again)
			const usColor3 = contextValue.resolveGroupColor( { group: 'united-states', index: 0 } );
			const gbColor3 = contextValue.resolveGroupColor( { group: 'great-britain', index: 1 } );
			const jpColor3 = contextValue.resolveGroupColor( { group: 'japan', index: 2 } );

			// All colors should remain stable throughout the process
			expect( usColor1 ).toBe( usColor2 );
			expect( usColor2 ).toBe( usColor3 );

			expect( gbColor1 ).toBe( gbColor3 );

			expect( jpColor1 ).toBe( jpColor2 );
			expect( jpColor2 ).toBe( jpColor3 );

			// Verify colors are distinct
			expect( usColor3 ).not.toBe( gbColor3 );
			expect( gbColor3 ).not.toBe( jpColor3 );
			expect( usColor3 ).not.toBe( jpColor3 );
		} );
	} );

	describe( 'Context stability', () => {
		it( 'maintains stable function references', () => {
			const functionRefs: Array< {
				registerChart: GlobalChartsContextValue[ 'registerChart' ];
				unregisterChart: GlobalChartsContextValue[ 'unregisterChart' ];
				getChartData: GlobalChartsContextValue[ 'getChartData' ];
				resolveGroupColor: GlobalChartsContextValue[ 'resolveGroupColor' ];
			} > = [];

			const TestComponent = () => {
				const context = useGlobalChartsContext();
				functionRefs.push( {
					registerChart: context.registerChart,
					unregisterChart: context.unregisterChart,
					getChartData: context.getChartData,
					resolveGroupColor: context.resolveGroupColor,
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
			expect( functionRefs[ 0 ].resolveGroupColor ).toBe( functionRefs[ 1 ].resolveGroupColor );
		} );
	} );
} );
