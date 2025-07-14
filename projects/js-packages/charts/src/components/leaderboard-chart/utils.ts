import type { LeaderboardEntry } from './leaderboard-chart';

/**
 * Data structure for raw leaderboard data
 */
export interface LeaderboardDataItem {
	id: string;
	name: string;
	current_period: {
		value: number;
	};
	previous_period: {
		value: number;
	};
}

/**
 * Calculates the relative percentage change between a current and previous value.
 *
 * @param current  - Current period value
 * @param previous - Previous period value
 * @return Percentage change as a number
 */
export const calculateDelta = ( current: number, previous: number ): number => {
	const currentNumber = Number( current );
	const previousNumber = Number( previous );

	if ( ! Number.isFinite( currentNumber ) || ! Number.isFinite( previousNumber ) ) {
		return 0;
	}

	if ( previousNumber === 0 ) {
		if ( currentNumber === 0 ) {
			return 0;
		}
		// Return a large number for infinite growth, but cap it for practical use
		return currentNumber > 0 ? 100 : -100;
	}

	// Standard relative percentage change, rounded to integer
	return Math.round( ( ( currentNumber - previousNumber ) / Math.abs( previousNumber ) ) * 100 );
};

/**
 * Calculate the percentage share of a value relative to the maximum value
 *
 * @param value    - The value to calculate share for
 * @param maxValue - The maximum value to calculate percentage against
 * @return Percentage share as a number (0-100)
 */
function calculateShare( value: number, maxValue: number ): number {
	return maxValue > 0 ? ( value / maxValue ) * 100 : 0;
}

/**
 * Build leaderboard data from raw data
 *
 * @param data     - Array of raw leaderboard data items
 * @param maxItems - Maximum number of items to return (default: 4)
 * @return Processed and sorted array of LeaderboardEntry objects
 */
export function buildLeaderboardData(
	data: LeaderboardDataItem[],
	maxItems = 4
): LeaderboardEntry[] {
	if ( ! data?.length ) {
		return [];
	}

	// Pick the max value from all current and previous period data
	const maxValue = Math.max(
		...data.map( item => item.current_period.value ),
		...data.map( item => item.previous_period.value )
	);

	const processedData = data.map( item => {
		const delta = calculateDelta( item.current_period.value, item.previous_period.value );

		const currentShare = calculateShare( item.current_period.value, maxValue );

		return {
			id: item.id,
			label: item.name,
			currentValue: item.current_period.value,
			currentShare,
			previousValue: item.previous_period.value,
			previousShare: calculateShare( item.previous_period.value, maxValue ),
			delta,
		};
	} );

	// Sort the data by current value in descending order
	const sortedData = processedData.sort( ( a, b ) => b.currentValue - a.currentValue );

	return sortedData.slice( 0, maxItems );
}
