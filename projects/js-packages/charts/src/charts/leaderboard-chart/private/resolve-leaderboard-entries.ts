import type { LeaderboardEntry } from '../../../types';

export type ResolvedLeaderboardEntry = LeaderboardEntry & { currentShare: number };

const toShare = ( value: number, max: number ) => ( max === 0 ? 0 : ( value / max ) * 100 );

const toDelta = ( currentValue: number, previousValue: number | undefined ) => {
	if ( previousValue == null ) {
		return undefined;
	}
	if ( previousValue === 0 ) {
		return currentValue === 0 ? 0 : undefined;
	}
	return ( ( currentValue - previousValue ) / Math.abs( previousValue ) ) * 100;
};

/**
 * Fills in the shares and delta an entry omits, derived from its values.
 *
 * @param data                    - Leaderboard entries; passed shares and delta win over derived ones.
 * @param options                 - Resolver options.
 * @param options.includePrevious - Whether previous values count toward the shared max.
 * @return Entries with `currentShare` always set.
 */
export function resolveLeaderboardEntries(
	data: LeaderboardEntry[],
	{ includePrevious }: { includePrevious: boolean }
): ResolvedLeaderboardEntry[] {
	const max = data.reduce( ( largest, { currentValue, previousValue } ) => {
		const previous = includePrevious && previousValue != null ? Math.abs( previousValue ) : 0;
		return Math.max( largest, Math.abs( currentValue ), previous );
	}, 0 );

	return data.map( entry => {
		const previousShare =
			entry.previousShare ??
			( entry.previousValue != null ? toShare( entry.previousValue, max ) : undefined );
		const delta = entry.delta ?? toDelta( entry.currentValue, entry.previousValue );

		return {
			...entry,
			currentShare: entry.currentShare ?? toShare( entry.currentValue, max ),
			...( previousShare !== undefined && { previousShare } ),
			...( delta !== undefined && { delta } ),
		};
	} );
}
