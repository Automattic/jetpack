import { render, act } from '@testing-library/react';
import { useMemo } from 'react';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useChartId } from '../hooks/use-chart-id';
import { useChartRegistration } from '../hooks/use-chart-registration';
import { useGlobalChartsContext } from '../hooks/use-global-charts-context';
import { wooTheme } from '../themes';
import type { BaseLegendItem } from '../../../components/legend';
import type { ChartTheme, SeriesData } from '../../../types';
import type { GlobalChartsContextValue } from '../types';

describe( 'ChartContext', () => {
	const mockTheme: ChartTheme = {
		colors: [ '#ff0000', '#00ff00', '#0000ff' ],
	} as ChartTheme;

	const mockLegendItems: BaseLegendItem[] = [
		{ label: 'Series 1', value: '100', color: '#ff0000' },
		{ label: 'Series 2', value: '200', color: '#00ff00' },
	];

	// Helper function to create mock data for color resolution tests
	const createMockDataWithGroup = ( group: string | undefined ): SeriesData => ( {
		label: 'Test',
		data: [ { value: 100 } ],
		group,
	} );

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

	describe( 'Color resolution', () => {
		it( 'provides getElementStyles function for color resolution', () => {
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

			expect( contextValue.getElementStyles ).toBeInstanceOf( Function );
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

			const color1 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'united-states' ),
				index: 0,
			} ).color;
			const color2 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'united-states' ),
				index: 5,
			} ).color;
			const color3 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'united-states' ),
				index: 10,
			} ).color;

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

			const usColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'united-states' ),
				index: 0,
			} ).color;
			const gbColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'great-britain' ),
				index: 0,
			} ).color;
			const jpColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'japan' ),
				index: 0,
			} ).color;

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
			const colorWithOverride = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'united-states' ),
				index: 0,
				overrideColor,
			} ).color;
			const colorWithoutOverride = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'united-states' ),
				index: 0,
			} ).color;

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

			const color = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 0,
			} ).color;

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

			const color = contextValue.getElementStyles( {
				data: createMockDataWithGroup( '' ),
				index: 0,
			} ).color;

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

			const color1 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 0,
			} ).color;
			const color2 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( '' ),
				index: 1,
			} ).color;
			const color3 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( null as string | undefined ),
				index: 2,
			} ).color;

			expect( color1 ).toBe( mockTheme.colors[ 0 ] );
			expect( color2 ).toBe( mockTheme.colors[ 1 ] );
			expect( color3 ).toBe( mockTheme.colors[ 2 ] );
		} );

		it( 'generates new colors when index exceeds theme color array', () => {
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

			// mockTheme has 3 colors, so index 3 should generate a new color
			const paletteColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 0,
			} ).color;
			const generatedColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 3,
			} ).color;

			// Generated color should be different from palette colors
			expect( generatedColor ).not.toBe( paletteColor );
			expect( generatedColor ).not.toBe( mockTheme.colors[ 0 ] );
			expect( generatedColor ).not.toBe( mockTheme.colors[ 1 ] );
			expect( generatedColor ).not.toBe( mockTheme.colors[ 2 ] );

			// Generated color should be in HSL format
			expect( generatedColor ).toMatch( /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/ );
		} );

		it( 'generates consistent colors for same index beyond palette', () => {
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

			// Generated colors should be consistent for the same index
			const color1 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 5,
			} ).color;
			const color2 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 5,
			} ).color;

			expect( color1 ).toBe( color2 );
		} );

		it( 'generates different colors for different indices beyond palette', () => {
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

			// Different indices should generate different colors
			const color1 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 3,
			} ).color;
			const color2 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 4,
			} ).color;
			const color3 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 5,
			} ).color;

			expect( color1 ).not.toBe( color2 );
			expect( color2 ).not.toBe( color3 );
			expect( color1 ).not.toBe( color3 );
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

			// Call getElementStyles multiple times for the same group
			for ( let i = 0; i < 10; i++ ) {
				colors.push(
					contextValue.getElementStyles( {
						data: createMockDataWithGroup( groupName ),
						index: i,
					} ).color
				);
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

			const groupColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( groupName ),
				index: 0,
			} ).color;
			const overriddenColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( groupName ),
				index: 0,
				overrideColor,
			} ).color;

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
			const initialColors = initialGroups.map(
				( { group, index } ) =>
					contextValue.getElementStyles( {
						data: createMockDataWithGroup( group ),
						index,
					} ).color
			);

			// Simulate removing the middle group (great-britain)
			// Now united-states is at index 0, japan is at index 1
			const filteredGroups = [
				{ group: 'united-states', index: 0 },
				{ group: 'japan', index: 1 }, // Note: index changed from 2 to 1
			];

			// Get colors after "filtering"
			const filteredColors = filteredGroups.map(
				( { group, index } ) =>
					contextValue.getElementStyles( {
						data: createMockDataWithGroup( group ),
						index,
					} ).color
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
			const usColor1 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'united-states' ),
				index: 0,
			} ).color;
			const gbColor1 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'great-britain' ),
				index: 1,
			} ).color;
			const jpColor1 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'japan' ),
				index: 2,
			} ).color;

			// Simulate removing great-britain (only US and Japan visible)
			const usColor2 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'united-states' ),
				index: 0,
			} ).color;
			const jpColor2 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'japan' ),
				index: 1,
			} ).color;

			// Simulate re-adding great-britain back (all groups visible again)
			const usColor3 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'united-states' ),
				index: 0,
			} ).color;
			const gbColor3 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'great-britain' ),
				index: 1,
			} ).color;
			const jpColor3 = contextValue.getElementStyles( {
				data: createMockDataWithGroup( 'japan' ),
				index: 2,
			} ).color;

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

	describe( 'Color cache performance', () => {
		it( 'maintains stable colors when theme remains unchanged', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Get initial generated color
			const initialColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 5,
			} ).color;

			// Re-render with same theme
			rerender(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Color should remain the same
			const afterRerenderColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 5,
			} ).color;

			expect( afterRerenderColor ).toBe( initialColor );
		} );

		it( 'updates colors when theme changes', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const newTheme: typeof mockTheme = {
				colors: [ '#000000', '#111111', '#222222' ],
			} as typeof mockTheme;

			const { rerender } = render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Get initial generated color
			const initialColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 5,
			} ).color;

			// Re-render with different theme
			rerender(
				<GlobalChartsProvider theme={ newTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Color should change due to different theme
			const afterThemeChangeColor = contextValue.getElementStyles( {
				data: createMockDataWithGroup( undefined ),
				index: 5,
			} ).color;

			expect( afterThemeChangeColor ).not.toBe( initialColor );
		} );

		it( 'generates colors with Woo theme characteristics', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			render(
				<GlobalChartsProvider theme={ wooTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Generate colors beyond the palette
			const generatedColors = [];
			for ( let i = 5; i < 8; i++ ) {
				const color = contextValue.getElementStyles( {
					data: createMockDataWithGroup( undefined ),
					index: i,
				} ).color;
				generatedColors.push( color );
			}

			// All generated colors should be in HSL format
			generatedColors.forEach( color => {
				expect( color ).toMatch( /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/ );
			} );

			// All generated colors should be different
			const uniqueColors = new Set( generatedColors );
			expect( uniqueColors.size ).toBe( generatedColors.length );
		} );
	} );

	describe( 'Context stability', () => {
		it( 'maintains stable function references when no theme changes', () => {
			const functionRefs: Array< {
				registerChart: GlobalChartsContextValue[ 'registerChart' ];
				unregisterChart: GlobalChartsContextValue[ 'unregisterChart' ];
				getChartData: GlobalChartsContextValue[ 'getChartData' ];
				getElementStyles: GlobalChartsContextValue[ 'getElementStyles' ];
			} > = [];

			const TestComponent = () => {
				const context = useGlobalChartsContext();
				functionRefs.push( {
					registerChart: context.registerChart,
					unregisterChart: context.unregisterChart,
					getChartData: context.getChartData,
					getElementStyles: context.getElementStyles,
				} );
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			rerender(
				<GlobalChartsProvider theme={ mockTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// After initial mount and theme effect, function refs should be stable across re-renders
			const lastTwoRefs = functionRefs.slice( -2 );
			expect( lastTwoRefs ).toHaveLength( 2 );
			expect( lastTwoRefs[ 0 ].registerChart ).toBe( lastTwoRefs[ 1 ].registerChart );
			expect( lastTwoRefs[ 0 ].unregisterChart ).toBe( lastTwoRefs[ 1 ].unregisterChart );
			expect( lastTwoRefs[ 0 ].getChartData ).toBe( lastTwoRefs[ 1 ].getChartData );
			expect( lastTwoRefs[ 0 ].getElementStyles ).toBe( lastTwoRefs[ 1 ].getElementStyles );
		} );
	} );

	describe( 'getElementStyles - DataPointPercentage handling', () => {
		it( 'handles DataPointPercentage data with color override', () => {
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

			const percentageDataWithColor = {
				label: 'Custom Color Point',
				value: 100,
				percentage: 50,
				color: '#ff9900',
			};

			const styles = contextValue.getElementStyles( {
				data: percentageDataWithColor,
				index: 0,
			} );

			expect( styles.color ).toBe( '#ff9900' );
			expect( styles.lineStyles ).toEqual( {} );
			expect( styles.shapeStyles ).toEqual( {} );
		} );

		it( 'handles DataPointPercentage data without color override', () => {
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

			const percentageDataWithoutColor = {
				label: 'No Color Point',
				value: 100,
				percentage: 50,
			};

			const styles = contextValue.getElementStyles( {
				data: percentageDataWithoutColor,
				index: 1,
			} );

			expect( styles.color ).toBe( mockTheme.colors[ 1 ] );
			expect( styles.lineStyles ).toEqual( {} );
			expect( styles.shapeStyles ).toEqual( {} );
		} );

		it( 'handles DataPointPercentage data with group', () => {
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

			const percentageDataWithGroup = {
				label: 'Grouped Point',
				value: 100,
				percentage: 50,
				group: 'pie-segment-group',
			};

			const styles1 = contextValue.getElementStyles( {
				data: percentageDataWithGroup,
				index: 0,
			} );
			const styles2 = contextValue.getElementStyles( {
				data: percentageDataWithGroup,
				index: 5,
			} );

			// Should have same color due to group consistency
			expect( styles1.color ).toBe( styles2.color );
		} );

		it( 'prioritizes DataPointPercentage color over group color', () => {
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

			const percentageDataWithBoth = {
				label: 'Both Color and Group',
				value: 100,
				percentage: 50,
				color: '#priority-color',
				group: 'test-group',
			};

			const styles = contextValue.getElementStyles( {
				data: percentageDataWithBoth,
				index: 0,
			} );

			expect( styles.color ).toBe( '#priority-color' );
		} );
	} );

	describe( 'getElementStyles - SeriesData line and shape styles', () => {
		it( 'returns line styles for SeriesData', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const extendedTheme = {
				...mockTheme,
				seriesLineStyles: [ { strokeWidth: 2 }, { strokeWidth: 3, strokeDasharray: '2 2' } ],
			};

			render(
				<GlobalChartsProvider theme={ extendedTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const seriesData = {
				label: 'Test Series',
				data: [ { value: 100 } ],
				options: {
					seriesLineStyle: { strokeWidth: 5, strokeDasharray: '10 5' },
				},
			};

			const styles = contextValue.getElementStyles( {
				data: seriesData,
				index: 0,
			} );

			expect( styles.lineStyles ).toEqual( {
				strokeWidth: 5,
				strokeDasharray: '10 5',
			} );
		} );

		it( 'returns shape styles for SeriesData', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const extendedTheme = {
				...mockTheme,
				legendShapeStyles: [
					{ fill: '#LEGEND1', stroke: '#BORDER1' },
					{ fill: '#LEGEND2', strokeWidth: 3 },
				],
			};

			render(
				<GlobalChartsProvider theme={ extendedTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const seriesDataWithShapeStyle = {
				label: 'Test Series',
				data: [ { value: 100 } ],
				options: {
					legendShapeStyle: { fill: '#CUSTOM', strokeWidth: 5 },
				},
			};

			const styles = contextValue.getElementStyles( {
				data: seriesDataWithShapeStyle,
				index: 0,
			} );

			expect( styles.shapeStyles ).toEqual( {
				fill: '#CUSTOM',
				strokeWidth: 5,
			} );
		} );

		it( 'combines line styles with shape styles when legendShape is line', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const extendedTheme = {
				...mockTheme,
				lineChart: {
					lineStyles: {
						comparison: {
							strokeDasharray: '4 4',
							strokeLinecap: 'square' as const,
							strokeWidth: 1.5,
						},
					},
				},
			};

			render(
				<GlobalChartsProvider theme={ extendedTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const comparisonSeries = {
				label: 'Comparison Series',
				data: [ { value: 100 } ],
				options: {
					type: 'comparison' as const,
					legendShapeStyle: { fill: '#CUSTOM' },
				},
			};

			const styles = contextValue.getElementStyles( {
				data: comparisonSeries,
				index: 0,
				legendShape: 'line',
			} );

			expect( styles.shapeStyles ).toEqual( {
				fill: '#CUSTOM',
				strokeDasharray: '4 4',
				strokeLinecap: 'square',
				strokeWidth: 1.5,
			} );
		} );

		it( 'does not include line styles in shapeStyles when legendShape is not line', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const extendedTheme = {
				...mockTheme,
				lineChart: {
					lineStyles: {
						comparison: {
							strokeDasharray: '4 4',
							strokeLinecap: 'square' as const,
							strokeWidth: 1.5,
						},
					},
				},
				legendShapeStyles: [ { fill: '#LEGEND1', stroke: '#BORDER1' } ],
			};

			render(
				<GlobalChartsProvider theme={ extendedTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const comparisonSeries = {
				label: 'Comparison Series',
				data: [ { value: 100 } ],
				options: {
					type: 'comparison' as const,
				},
			};

			const styles = contextValue.getElementStyles( {
				data: comparisonSeries,
				index: 0,
				legendShape: 'rect',
			} );

			// Should get theme legend shape styles, not line styles
			expect( styles.shapeStyles ).toEqual( {
				fill: '#LEGEND1',
				stroke: '#BORDER1',
			} );
		} );
	} );

	describe( 'getElementStyles - glyph assignment', () => {
		it( 'assigns glyph from theme based on index', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const mockGlyph1 = jest.fn();
			const mockGlyph2 = jest.fn();

			const themeWithGlyphs = {
				...mockTheme,
				glyphs: [ mockGlyph1, mockGlyph2 ],
			};

			render(
				<GlobalChartsProvider theme={ themeWithGlyphs }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const seriesData = {
				label: 'Test Series',
				data: [ { value: 100 } ],
			};

			const styles1 = contextValue.getElementStyles( {
				data: seriesData,
				index: 0,
			} );
			const styles2 = contextValue.getElementStyles( {
				data: seriesData,
				index: 1,
			} );

			expect( styles1.glyph ).toBe( mockGlyph1 );
			expect( styles2.glyph ).toBe( mockGlyph2 );
		} );

		it( 'handles undefined glyph when index exceeds glyph array', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const mockGlyph = jest.fn();
			const themeWithGlyphs = {
				...mockTheme,
				glyphs: [ mockGlyph ],
			};

			render(
				<GlobalChartsProvider theme={ themeWithGlyphs }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const seriesData = {
				label: 'Test Series',
				data: [ { value: 100 } ],
			};

			const styles = contextValue.getElementStyles( {
				data: seriesData,
				index: 5, // Beyond array length
			} );

			expect( styles.glyph ).toBeUndefined();
		} );

		it( 'handles missing glyphs in theme', () => {
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

			const seriesData = {
				label: 'Test Series',
				data: [ { value: 100 } ],
			};

			const styles = contextValue.getElementStyles( {
				data: seriesData,
				index: 0,
			} );

			expect( styles.glyph ).toBeUndefined();
		} );
	} );

	describe( 'getElementStyles - complete object structure', () => {
		it( 'returns complete ElementStyles object for SeriesData', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const mockGlyph = jest.fn();
			const completeTheme = {
				...mockTheme,
				glyphs: [ mockGlyph ],
				seriesLineStyles: [ { strokeWidth: 2 } ],
				legendShapeStyles: [ { fill: '#SHAPE1' } ],
			};

			render(
				<GlobalChartsProvider theme={ completeTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const seriesData = {
				label: 'Test Series',
				data: [ { value: 100 } ],
				group: 'test-group',
			};

			const styles = contextValue.getElementStyles( {
				data: seriesData,
				index: 0,
			} );

			// Verify all properties are present
			expect( styles ).toHaveProperty( 'color' );
			expect( styles ).toHaveProperty( 'lineStyles' );
			expect( styles ).toHaveProperty( 'glyph' );
			expect( styles ).toHaveProperty( 'shapeStyles' );

			// Verify types
			expect( typeof styles.color ).toBe( 'string' );
			expect( typeof styles.lineStyles ).toBe( 'object' );
			expect( typeof styles.glyph ).toBe( 'function' );
			expect( typeof styles.shapeStyles ).toBe( 'object' );
		} );

		it( 'returns complete ElementStyles object for DataPointPercentage', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const mockGlyph = jest.fn();
			const completeTheme = {
				...mockTheme,
				glyphs: [ mockGlyph ],
			};

			render(
				<GlobalChartsProvider theme={ completeTheme }>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const percentageData = {
				label: 'Test Point',
				value: 100,
				percentage: 50,
				color: '#custom',
			};

			const styles = contextValue.getElementStyles( {
				data: percentageData,
				index: 0,
			} );

			// Verify all properties are present
			expect( styles ).toHaveProperty( 'color' );
			expect( styles ).toHaveProperty( 'lineStyles' );
			expect( styles ).toHaveProperty( 'glyph' );
			expect( styles ).toHaveProperty( 'shapeStyles' );

			// Verify values for percentage data
			expect( styles.color ).toBe( '#custom' );
			expect( styles.lineStyles ).toEqual( {} );
			expect( styles.glyph ).toBe( mockGlyph );
			expect( styles.shapeStyles ).toEqual( {} );
		} );

		it( 'handles undefined data gracefully', () => {
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

			const styles = contextValue.getElementStyles( {
				data: undefined,
				index: 0,
			} );

			expect( styles ).toHaveProperty( 'color' );
			expect( styles ).toHaveProperty( 'lineStyles' );
			expect( styles ).toHaveProperty( 'glyph' );
			expect( styles ).toHaveProperty( 'shapeStyles' );

			expect( styles.color ).toBe( mockTheme.colors[ 0 ] );
			expect( styles.lineStyles ).toEqual( {} );
			expect( styles.glyph ).toBeUndefined();
			expect( styles.shapeStyles ).toEqual( {} );
		} );
	} );

	describe( 'getElementStyles - overrideColor precedence with SeriesData', () => {
		it( 'prioritizes explicit overrideColor over series stroke', () => {
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

			const seriesWithStroke = {
				label: 'Series with stroke',
				data: [ { value: 100 } ],
				options: { stroke: '#series-stroke' },
			};

			const styles = contextValue.getElementStyles( {
				data: seriesWithStroke,
				index: 0,
				overrideColor: '#explicit-override',
			} );

			expect( styles.color ).toBe( '#explicit-override' );
		} );

		it( 'uses series stroke when no explicit overrideColor', () => {
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

			const seriesWithStroke = {
				label: 'Series with stroke',
				data: [ { value: 100 } ],
				options: { stroke: '#series-stroke' },
			};

			const styles = contextValue.getElementStyles( {
				data: seriesWithStroke,
				index: 0,
			} );

			expect( styles.color ).toBe( '#series-stroke' );
		} );
	} );

	describe( 'Series visibility management', () => {
		it( 'toggleSeriesVisibility hides a visible series', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Initially, series should be visible
			expect( contextValue.isSeriesVisible( 'test-chart', 'Series 1' ) ).toBe( true );

			// Toggle to hide
			act( () => {
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 1' );
			} );

			// Rerender to apply state change
			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Now should be hidden
			expect( contextValue.isSeriesVisible( 'test-chart', 'Series 1' ) ).toBe( false );
		} );

		it( 'toggleSeriesVisibility shows a hidden series', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Hide series first
			act( () => {
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 1' );
			} );
			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);
			expect( contextValue.isSeriesVisible( 'test-chart', 'Series 1' ) ).toBe( false );

			// Toggle to show
			act( () => {
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 1' );
			} );
			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Now should be visible again
			expect( contextValue.isSeriesVisible( 'test-chart', 'Series 1' ) ).toBe( true );
		} );

		it( 'manages hidden series independently per chart', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Hide series in chart1
			act( () => {
				contextValue.toggleSeriesVisibility( 'chart1', 'Series A' );
			} );
			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Series A should be hidden in chart1 but visible in chart2
			expect( contextValue.isSeriesVisible( 'chart1', 'Series A' ) ).toBe( false );
			expect( contextValue.isSeriesVisible( 'chart2', 'Series A' ) ).toBe( true );
		} );

		it( 'manages multiple hidden series in same chart', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Hide multiple series
			act( () => {
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 1' );
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 2' );
			} );
			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Both should be hidden
			expect( contextValue.isSeriesVisible( 'test-chart', 'Series 1' ) ).toBe( false );
			expect( contextValue.isSeriesVisible( 'test-chart', 'Series 2' ) ).toBe( false );

			// Series 3 should still be visible
			expect( contextValue.isSeriesVisible( 'test-chart', 'Series 3' ) ).toBe( true );
		} );

		it( 'getHiddenSeries returns set of hidden series labels', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Hide some series
			act( () => {
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 1' );
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 3' );
			} );
			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const hidden = contextValue.getHiddenSeries( 'test-chart' );

			expect( hidden ).toBeInstanceOf( Set );
			expect( hidden.size ).toBe( 2 );
			expect( hidden.has( 'Series 1' ) ).toBe( true );
			expect( hidden.has( 'Series 3' ) ).toBe( true );
			expect( hidden.has( 'Series 2' ) ).toBe( false );
		} );

		it( 'getHiddenSeries returns empty set for chart with no hidden series', () => {
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

			const hidden = contextValue.getHiddenSeries( 'test-chart' );

			expect( hidden ).toBeInstanceOf( Set );
			expect( hidden.size ).toBe( 0 );
		} );

		it( 'getHiddenSeries returns defensive copy of set', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Hide a series
			act( () => {
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 1' );
			} );
			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const hidden1 = contextValue.getHiddenSeries( 'test-chart' );
			const hidden2 = contextValue.getHiddenSeries( 'test-chart' );

			// Should be different Set instances (defensive copy)
			expect( hidden1 ).not.toBe( hidden2 );

			// But with same contents
			expect( hidden1.size ).toBe( hidden2.size );
			expect( hidden1.has( 'Series 1' ) ).toBe( hidden2.has( 'Series 1' ) );

			// Modifying returned set should not affect internal state
			hidden1.add( 'Series 2' );
			expect( contextValue.isSeriesVisible( 'test-chart', 'Series 2' ) ).toBe( true );
		} );

		it( 'removes chart entry when all series become visible again', () => {
			let contextValue: GlobalChartsContextValue;

			const TestComponent = () => {
				contextValue = useGlobalChartsContext();
				return <div>Test</div>;
			};

			const { rerender } = render(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			// Hide and then show a series
			act( () => {
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 1' );
			} );
			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			act( () => {
				contextValue.toggleSeriesVisibility( 'test-chart', 'Series 1' );
			} );
			rerender(
				<GlobalChartsProvider>
					<TestComponent />
				</GlobalChartsProvider>
			);

			const hidden = contextValue.getHiddenSeries( 'test-chart' );

			// Should have empty set after all series are visible
			expect( hidden.size ).toBe( 0 );
		} );
	} );
} );
