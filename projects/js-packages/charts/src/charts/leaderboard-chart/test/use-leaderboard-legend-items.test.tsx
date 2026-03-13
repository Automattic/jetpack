import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { GlobalChartsProvider } from '../../../providers';
import { useLeaderboardLegendItems } from '../hooks/use-leaderboard-legend-items';
import type { LeaderboardEntry } from '../../../types';

const mockData: LeaderboardEntry[] = [
	{
		id: 'direct',
		label: 'Direct',
		currentValue: 12500,
		previousValue: 10000,
		currentShare: 100,
		previousShare: 80,
		delta: 25,
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
		currentShare: 70,
		previousShare: 76,
		delta: -8,
	},
];

/**
 * Test wrapper that provides GlobalChartsProvider context
 *
 * @param customTheme - Custom theme object to pass to provider
 * @return React component wrapper for testing
 */
const createWrapper = ( customTheme: object = {} ) => {
	return ( { children }: { children: ReactNode } ) => (
		<GlobalChartsProvider theme={ customTheme }>{ children }</GlobalChartsProvider>
	);
};

describe( 'useLeaderboardLegendItems', () => {
	describe( 'Basic functionality', () => {
		it( 'should return empty array for empty data', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( { data: [], withComparison: false, withOverlayLabel: false } ),
				{ wrapper }
			);

			expect( result.current ).toEqual( [] );
		} );

		it( 'should return empty array for null/undefined data', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: null as unknown as LeaderboardEntry[],
						withComparison: false,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			expect( result.current ).toEqual( [] );
		} );

		it( 'should generate single legend item without comparison', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: false,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			expect( result.current ).toHaveLength( 1 );
			expect( result.current[ 0 ] ).toEqual( {
				label: 'Current period',
				color: expect.any( String ),
			} );
		} );

		it( 'should generate two legend items with comparison enabled', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: true,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			expect( result.current ).toHaveLength( 2 );

			// Current period item
			expect( result.current[ 0 ] ).toEqual( {
				label: 'Current period',
				color: expect.any( String ),
			} );

			// Previous period item
			expect( result.current[ 1 ] ).toEqual( {
				label: 'Previous period',
				color: expect.any( String ),
			} );
		} );
	} );

	describe( 'Color handling', () => {
		it( 'should use default theme colors', () => {
			const customTheme = {
				leaderboardChart: {
					primaryColor: '#FF0000',
					secondaryColor: '#00FF00',
				},
			};
			const wrapper = createWrapper( customTheme );
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: true,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			// Note: The actual color will be resolved by the context, but we can check structure
			expect( result.current[ 0 ].color ).toBeTruthy();
			expect( result.current[ 1 ].color ).toBeTruthy();
		} );

		it( 'should use custom primary color override', () => {
			const wrapper = createWrapper();
			const customPrimary = '#CUSTOM1';
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						primaryColor: customPrimary,
						withComparison: false,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].color ).toBe( customPrimary );
		} );

		it( 'should use custom secondary color override', () => {
			const wrapper = createWrapper();
			const customPrimary = '#CUSTOM1';
			const customSecondary = '#CUSTOM2';
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						primaryColor: customPrimary,
						secondaryColor: customSecondary,
						withComparison: true,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].color ).toBe( customPrimary );
			expect( result.current[ 1 ].color ).toBe( customSecondary );
		} );

		it( 'should use both custom colors with comparison', () => {
			const wrapper = createWrapper();
			const customPrimary = '#FF5555';
			const customSecondary = '#55FF55';
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						primaryColor: customPrimary,
						secondaryColor: customSecondary,
						withComparison: true,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			expect( result.current ).toHaveLength( 2 );
			expect( result.current[ 0 ].color ).toBe( customPrimary );
			expect( result.current[ 1 ].color ).toBe( customSecondary );
		} );
	} );

	describe( 'Label behavior', () => {
		it( 'should use "Current period" label when comparison is disabled', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: false,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].label ).toBe( 'Current period' );
		} );

		it( 'should use "Current period" label when comparison is enabled', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: true,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].label ).toBe( 'Current period' );
			expect( result.current[ 1 ].label ).toBe( 'Previous period' );
		} );

		it( 'should use custom current label when provided', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: false,
						withOverlayLabel: false,
						legendLabels: {
							primary: 'Aug 11-Sep 9, 2025',
						},
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].label ).toBe( 'Aug 11-Sep 9, 2025' );
		} );

		it( 'should use custom labels when both provided with comparison', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: true,
						withOverlayLabel: false,
						legendLabels: {
							primary: 'Aug 11-Sep 9, 2025',
							comparison: 'Jul 11-Aug 11, 2025',
						},
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].label ).toBe( 'Aug 11-Sep 9, 2025' );
			expect( result.current[ 1 ].label ).toBe( 'Jul 11-Aug 11, 2025' );
		} );

		it( 'should fall back to default when only partial custom labels provided', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: true,
						withOverlayLabel: false,
						legendLabels: {
							primary: 'Custom Current',
							// comparison not provided
						},
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].label ).toBe( 'Custom Current' );
			expect( result.current[ 1 ].label ).toBe( 'Previous period' );
		} );

		it( 'should override default labels even when custom provided without comparison', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: false,
						withOverlayLabel: false,
						legendLabels: {
							primary: 'Single Period Data',
						},
					} ),
				{ wrapper }
			);

			expect( result.current[ 0 ].label ).toBe( 'Single Period Data' );
		} );
	} );

	describe( 'Memoization', () => {
		it( 'should return same reference when inputs unchanged', () => {
			const wrapper = createWrapper();
			const stableLabels = { primary: 'Current', comparison: 'Previous' };
			const { result, rerender } = renderHook(
				( {
					data,
					primary,
					secondary,
					comparison,
					labels,
				}: {
					data: LeaderboardEntry[];
					primary?: string;
					secondary?: string;
					comparison: boolean;
					labels?: { primary?: string; comparison?: string };
				} ) =>
					useLeaderboardLegendItems( {
						data,
						primaryColor: primary,
						secondaryColor: secondary,
						withComparison: comparison,
						withOverlayLabel: false,
						legendLabels: labels,
					} ),
				{
					wrapper,
					initialProps: {
						data: mockData,
						primary: '#FF0000',
						secondary: '#00FF00',
						comparison: true,
						labels: stableLabels,
					},
				}
			);

			const firstResult = result.current;

			// Rerender with same props
			rerender( {
				data: mockData,
				primary: '#FF0000',
				secondary: '#00FF00',
				comparison: true,
				labels: stableLabels,
			} );

			expect( result.current ).toBe( firstResult );
		} );

		it( 'should return new reference when data changes', () => {
			const wrapper = createWrapper();
			const stableLabels = { primary: 'Current', comparison: 'Previous' };
			const { result, rerender } = renderHook(
				( {
					data,
					primary,
					secondary,
					comparison,
					labels,
				}: {
					data: LeaderboardEntry[];
					primary?: string;
					secondary?: string;
					comparison: boolean;
					labels?: { primary?: string; comparison?: string };
				} ) =>
					useLeaderboardLegendItems( {
						data,
						primaryColor: primary,
						secondaryColor: secondary,
						withComparison: comparison,
						withOverlayLabel: false,
						legendLabels: labels,
					} ),
				{
					wrapper,
					initialProps: {
						data: mockData,
						primary: '#FF0000',
						secondary: '#00FF00',
						comparison: true,
						labels: stableLabels,
					},
				}
			);

			const firstResult = result.current;

			// Rerender with different data
			rerender( {
				data: [ mockData[ 0 ] ], // Different array
				primary: '#FF0000',
				secondary: '#00FF00',
				comparison: true,
				labels: stableLabels,
			} );

			expect( result.current ).not.toBe( firstResult );
		} );

		it( 'should return new reference when comparison flag changes', () => {
			const wrapper = createWrapper();
			const stableLabels = { primary: 'Current' };
			const { result, rerender } = renderHook(
				( {
					data,
					primary,
					secondary,
					comparison,
					labels,
				}: {
					data: LeaderboardEntry[];
					primary?: string;
					secondary?: string;
					comparison: boolean;
					labels?: { primary?: string; comparison?: string };
				} ) =>
					useLeaderboardLegendItems( {
						data,
						primaryColor: primary,
						secondaryColor: secondary,
						withComparison: comparison,
						withOverlayLabel: false,
						legendLabels: labels,
					} ),
				{
					wrapper,
					initialProps: {
						data: mockData,
						primary: '#FF0000',
						secondary: '#00FF00',
						comparison: false,
						labels: stableLabels,
					},
				}
			);

			const firstResult = result.current;
			expect( firstResult ).toHaveLength( 1 );

			// Toggle comparison
			rerender( {
				data: mockData,
				primary: '#FF0000',
				secondary: '#00FF00',
				comparison: true,
				labels: stableLabels,
			} );

			expect( result.current ).not.toBe( firstResult );
			expect( result.current ).toHaveLength( 2 );
		} );

		it( 'should return new reference when colors change', () => {
			const wrapper = createWrapper();
			const stableLabels = { primary: 'Current', comparison: 'Previous' };
			const { result, rerender } = renderHook(
				( {
					data,
					primary,
					secondary,
					comparison,
					labels,
				}: {
					data: LeaderboardEntry[];
					primary?: string;
					secondary?: string;
					comparison: boolean;
					labels?: { primary?: string; comparison?: string };
				} ) =>
					useLeaderboardLegendItems( {
						data,
						primaryColor: primary,
						secondaryColor: secondary,
						withComparison: comparison,
						withOverlayLabel: false,
						legendLabels: labels,
					} ),
				{
					wrapper,
					initialProps: {
						data: mockData,
						primary: '#FF0000',
						secondary: '#00FF00',
						comparison: true,
						labels: stableLabels,
					},
				}
			);

			const firstResult = result.current;

			// Change primary color
			rerender( {
				data: mockData,
				primary: '#0000FF', // Different color
				secondary: '#00FF00',
				comparison: true,
				labels: stableLabels,
			} );

			expect( result.current ).not.toBe( firstResult );
		} );

		it( 'should return new reference when legend labels change', () => {
			const wrapper = createWrapper();
			const { result, rerender } = renderHook(
				( {
					data,
					primary,
					secondary,
					comparison,
					labels,
				}: {
					data: LeaderboardEntry[];
					primary?: string;
					secondary?: string;
					comparison: boolean;
					labels?: { primary?: string; comparison?: string };
				} ) =>
					useLeaderboardLegendItems( {
						data,
						primaryColor: primary,
						secondaryColor: secondary,
						withComparison: comparison,
						withOverlayLabel: false,
						legendLabels: labels,
					} ),
				{
					wrapper,
					initialProps: {
						data: mockData,
						primary: '#FF0000',
						secondary: '#00FF00',
						comparison: true,
						labels: { primary: 'Aug 11-Sep 9, 2025', comparison: 'Jul 11-Aug 11, 2025' },
					},
				}
			);

			const firstResult = result.current;

			// Change legend labels
			rerender( {
				data: mockData,
				primary: '#FF0000',
				secondary: '#00FF00',
				comparison: true,
				labels: { primary: 'This Period', comparison: 'Last Period' },
			} );

			expect( result.current ).not.toBe( firstResult );
			expect( result.current[ 0 ].label ).toBe( 'This Period' );
			expect( result.current[ 1 ].label ).toBe( 'Last Period' );
		} );
	} );

	describe( 'Index and structure validation', () => {
		it( 'should have correct number of items with comparison', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: true,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			expect( result.current ).toHaveLength( 2 );
			expect( result.current[ 0 ].label ).toBe( 'Current period' );
			expect( result.current[ 1 ].label ).toBe( 'Previous period' );
		} );

		it( 'should not include value property for legend items', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: true,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			result.current.forEach( item => {
				expect( item ).not.toHaveProperty( 'value' );
			} );
		} );

		it( 'should have valid color strings', () => {
			const wrapper = createWrapper();
			const { result } = renderHook(
				() =>
					useLeaderboardLegendItems( {
						data: mockData,
						withComparison: true,
						withOverlayLabel: false,
					} ),
				{ wrapper }
			);

			result.current.forEach( item => {
				expect( typeof item.color ).toBe( 'string' );
				expect( item.color.length ).toBeGreaterThan( 0 );
			} );
		} );
	} );
} );
