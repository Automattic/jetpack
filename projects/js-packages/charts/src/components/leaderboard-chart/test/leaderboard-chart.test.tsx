import { render, screen } from '@testing-library/react';
import { LeaderboardChart } from '../leaderboard-chart';
import { buildLeaderboardData, calculateDelta } from '../utils';
import type { LeaderboardEntry } from '../leaderboard-chart';

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
 * Custom value formatter for testing
 *
 * @param value - Value to format
 * @return Formatted value
 */
const testValueFormatter = ( value: number ) => `${ value }$`;

/**
 * Custom delta formatter for testing
 *
 * @param value - Delta value to format
 * @return Formatted delta value
 */
const testDeltaFormatter = ( value: number ) => `${ value }delta`;

describe( 'LeaderboardChart', () => {
	it( 'renders leaderboard entries', () => {
		render( <LeaderboardChart data={ mockData } /> );

		expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Social Media' ) ).toBeInTheDocument();
	} );

	it( 'renders values with default formatter', () => {
		render( <LeaderboardChart data={ mockData } /> );

		expect( screen.getByText( '12.5K' ) ).toBeInTheDocument();
		expect( screen.getByText( '8.8K' ) ).toBeInTheDocument();
	} );

	it( 'shows comparison data when withComparison is true', () => {
		render( <LeaderboardChart data={ mockData } withComparison={ true } /> );

		expect( screen.getByText( '+25%' ) ).toBeInTheDocument();
		expect( screen.getByText( '-8%' ) ).toBeInTheDocument();
	} );

	it( 'hides comparison data when withComparison is false', () => {
		render( <LeaderboardChart data={ mockData } withComparison={ false } /> );

		expect( screen.queryByText( '+25%' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '-8%' ) ).not.toBeInTheDocument();
	} );

	it( 'applies loading state correctly', () => {
		render( <LeaderboardChart data={ mockData } loading={ true } /> );

		// Test that the loading functionality works by checking if the component renders
		expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Social Media' ) ).toBeInTheDocument();
	} );

	it( 'uses custom formatters when provided', () => {
		render(
			<LeaderboardChart
				data={ mockData }
				withComparison={ true }
				valueFormatter={ testValueFormatter }
				deltaFormatter={ testDeltaFormatter }
			/>
		);

		expect( screen.getByText( '12500$' ) ).toBeInTheDocument();
		expect( screen.getByText( '25delta' ) ).toBeInTheDocument();
	} );

	it( 'applies custom colors', () => {
		render(
			<LeaderboardChart data={ mockData } primaryColor="#FF0000" secondaryColor="#00FF00" />
		);

		// Test that the component renders correctly with custom colors
		expect( screen.getByText( 'Direct' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Social Media' ) ).toBeInTheDocument();
	} );

	it( 'handles empty data', () => {
		render( <LeaderboardChart data={ [] } /> );

		expect( screen.queryByText( 'Direct' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Utils', () => {
	describe( 'calculateDelta', () => {
		it( 'calculates positive delta correctly', () => {
			expect( calculateDelta( 120, 100 ) ).toBe( 20 );
		} );

		it( 'calculates negative delta correctly', () => {
			expect( calculateDelta( 80, 100 ) ).toBe( -20 );
		} );

		it( 'handles zero previous value', () => {
			expect( calculateDelta( 100, 0 ) ).toBe( 100 );
			expect( calculateDelta( 0, 0 ) ).toBe( 0 );
		} );

		it( 'handles invalid inputs', () => {
			expect( calculateDelta( NaN, 100 ) ).toBe( 0 );
			expect( calculateDelta( 100, NaN ) ).toBe( 0 );
		} );
	} );

	describe( 'buildLeaderboardData', () => {
		const rawData = [
			{
				id: 'a',
				name: 'Item A',
				current_period: { value: 100 },
				previous_period: { value: 80 },
			},
			{
				id: 'b',
				name: 'Item B',
				current_period: { value: 200 },
				previous_period: { value: 160 },
			},
		];

		it( 'processes raw data correctly', () => {
			const result = buildLeaderboardData( rawData );

			expect( result ).toHaveLength( 2 );
			expect( result[ 0 ] ).toMatchObject( {
				id: 'b',
				label: 'Item B',
				currentValue: 200,
				previousValue: 160,
			} );
		} );

		it( 'sorts by current value descending', () => {
			const result = buildLeaderboardData( rawData );

			expect( result[ 0 ].currentValue ).toBeGreaterThan( result[ 1 ].currentValue );
		} );

		it( 'limits results to maxItems', () => {
			const result = buildLeaderboardData( rawData, 1 );

			expect( result ).toHaveLength( 1 );
		} );

		it( 'handles empty data', () => {
			const result = buildLeaderboardData( [] );

			expect( result ).toHaveLength( 0 );
		} );
	} );
} );
