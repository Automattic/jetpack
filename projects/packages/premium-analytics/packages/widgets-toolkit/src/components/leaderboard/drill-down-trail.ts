/**
 * Internal dependencies
 */
import type { LeaderboardRowInput } from './build-leaderboard-chart-data';

/**
 * Follow a path of row ids down the children, as far as it holds.
 *
 * A row is a step only while it has children: a trail that ends short of the path means the
 * data no longer backs the selection, which the leaderboard then trims once the data settles.
 *
 * @param rows - Top-level rows.
 * @param path - Ids of the selected rows, top level first.
 * @return The rows along the path, top level first.
 */
export function resolveDrillDownTrail(
	rows: readonly LeaderboardRowInput[],
	path: readonly string[] | null
): LeaderboardRowInput[] {
	const trail: LeaderboardRowInput[] = [];
	let level: readonly LeaderboardRowInput[] = rows;

	for ( const id of path ?? [] ) {
		const row = level.find( candidate => candidate.id === id );
		if ( ! row?.children?.length ) {
			break;
		}
		trail.push( row );
		level = row.children;
	}

	return trail;
}
