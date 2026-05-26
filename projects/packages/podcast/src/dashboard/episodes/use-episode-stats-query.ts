import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import type { EpisodeStats } from '../types';

/**
 * Read plays + duration for a set of episode post IDs. Custom wpcom endpoint
 * (no core-data entity), so a thin `apiFetch` + `useState` wrapper. Server
 * caches 5 minutes; refetching on remount is cheap.
 *
 * `premiumRequired` is `true` when the endpoint responds with a
 * `podcast_premium_required` error code. The dashboard tab gate normally
 * hides the stats UI before any request fires, so this is a defense-in-depth
 * state for stale gate snapshots and grandfather-edge races.
 *
 * @param postIds - Episode post IDs (from the visible page of the table).
 * @return         `{ data, premiumRequired }`.
 */
export function useEpisodeStatsQuery( postIds: number[] ): {
	data: EpisodeStats[];
	premiumRequired: boolean;
} {
	const [ data, setData ] = useState< EpisodeStats[] >( [] );
	const [ premiumRequired, setPremiumRequired ] = useState( false );
	// Sort so the effect dep is stable regardless of incoming order.
	const key = useMemo( () => [ ...postIds ].sort( ( a, b ) => a - b ).join( ',' ), [ postIds ] );

	useEffect( () => {
		if ( ! key ) {
			setData( [] );
			setPremiumRequired( false );
			return;
		}
		const ids = key.split( ',' ).map( Number );
		let cancelled = false;
		( async () => {
			const out: EpisodeStats[] = [];
			// Chunked to 50 IDs to match the wpcom endpoint's max page size.
			for ( let i = 0; i < ids.length; i += 50 ) {
				if ( cancelled ) {
					return;
				}
				const chunk = ids.slice( i, i + 50 );
				try {
					const result = ( await apiFetch( {
						path: addQueryArgs( '/wpcom/v2/podcast-stats/episode-totals', {
							post_ids: chunk.join( ',' ),
						} ),
						method: 'GET',
					} ) ) as { episodes?: EpisodeStats[] } | EpisodeStats[];
					if ( Array.isArray( result ) ) {
						out.push( ...result );
					} else if ( result.episodes ) {
						out.push( ...result.episodes );
					}
				} catch ( error ) {
					const err = error as { code?: string };
					if ( err?.code === 'podcast_premium_required' ) {
						if ( ! cancelled ) {
							setData( [] );
							setPremiumRequired( true );
						}
						return;
					}
					throw error;
				}
			}
			if ( ! cancelled ) {
				setData( out );
				setPremiumRequired( false );
			}
		} )();
		return () => {
			cancelled = true;
		};
	}, [ key ] );

	return { data, premiumRequired };
}
