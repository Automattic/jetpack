import { getSiteData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import type { EpisodeStats } from '../types';

/**
 * Read plays + duration for a set of episode post IDs. Custom wpcom endpoint
 * (no core-data entity), so a thin `apiFetch` + `useState` wrapper. Server
 * caches 5 minutes; refetching on remount is cheap.
 *
 * @param postIds - Episode post IDs (from the visible page of the table).
 * @return         `{ data }` matching the prior TanStack-shaped contract.
 */
export function useEpisodeStatsQuery( postIds: number[] ): { data: EpisodeStats[] } {
	const [ data, setData ] = useState< EpisodeStats[] >( [] );
	// Sort so the effect dep is stable regardless of incoming order.
	const key = useMemo( () => [ ...postIds ].sort( ( a, b ) => a - b ).join( ',' ), [ postIds ] );

	useEffect( () => {
		if ( ! key ) {
			setData( [] );
			return;
		}
		const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
		if ( ! blogId ) {
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
				const result = ( await apiFetch( {
					path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/podcast-stats/episode-totals`, {
						post_ids: chunk.join( ',' ),
					} ),
					method: 'GET',
				} ) ) as { episodes?: EpisodeStats[] } | EpisodeStats[];
				if ( Array.isArray( result ) ) {
					out.push( ...result );
				} else if ( result.episodes ) {
					out.push( ...result.episodes );
				}
			}
			if ( ! cancelled ) {
				setData( out );
			}
		} )();
		return () => {
			cancelled = true;
		};
	}, [ key ] );

	return { data };
}
