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
 * @param options.clampNegative   - Whether a negative share draws as an empty bar instead of below zero.
 * @return Entries with `currentShare` always set.
 */
export function resolveLeaderboardEntries(
	data: LeaderboardEntry[],
	{ includePrevious, clampNegative = false }: { includePrevious: boolean; clampNegative?: boolean }
): ResolvedLeaderboardEntry[] {
	const magnitude = clampNegative ? ( value: number ) => Math.max( value, 0 ) : Math.abs;
	const clamp = ( share: number ) => ( clampNegative ? Math.max( share, 0 ) : share );

	const max = data.reduce( ( largest, { currentValue, previousValue } ) => {
		const previous = includePrevious && previousValue != null ? magnitude( previousValue ) : 0;
		return Math.max( largest, magnitude( currentValue ), previous );
	}, 0 );

	return data.map( entry => {
		const passedOrDerivedPrevious =
			entry.previousShare ??
			( entry.previousValue != null ? toShare( entry.previousValue, max ) : undefined );
		const previousShare =
			passedOrDerivedPrevious !== undefined ? clamp( passedOrDerivedPrevious ) : undefined;
		const delta = entry.delta ?? toDelta( entry.currentValue, entry.previousValue );

		return {
			...entry,
			currentShare: clamp( entry.currentShare ?? toShare( entry.currentValue, max ) ),
			...( previousShare !== undefined && { previousShare } ),
			...( delta !== undefined && { delta } ),
		};
	} );
}
