import { getSiteData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import type { EpisodeStats } from '../types';

// Module-level cache so re-mounts (e.g. tab switches) don't refetch. Stays
// alive for the page session — the wpcom endpoint already caches 5 minutes
// server-side, so the duplicated state is bounded.
const cache = new Map< string, EpisodeStats[] >();

// Chunked to 50 IDs to match the wpcom endpoint's max page size.
const fetchEpisodeStats = async ( postIds: number[] ): Promise< EpisodeStats[] > => {
	if ( postIds.length === 0 ) {
		return [];
	}
	const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
	if ( ! blogId ) {
		return [];
	}

	const out: EpisodeStats[] = [];
	for ( let i = 0; i < postIds.length; i += 50 ) {
		const chunk = postIds.slice( i, i + 50 );
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
	return out;
};

/**
 * Read plays + duration for a set of episode post IDs. Custom endpoint, so
 * core-data has no entity for it — hand-rolled cache by sorted-id key.
 *
 * @param postIds - Episode post IDs (from the visible page of the table).
 * @return         `{ data }` matching the prior TanStack-shaped contract.
 */
export function useEpisodeStatsQuery( postIds: number[] ): { data: EpisodeStats[] } {
	// Sort so the cache key is stable regardless of incoming order.
	const key = [ ...postIds ].sort( ( a, b ) => a - b ).join( ',' );
	const [ data, setData ] = useState< EpisodeStats[] >( () => cache.get( key ) ?? [] );

	useEffect( () => {
		if ( ! key ) {
			setData( [] );
			return;
		}
		const cached = cache.get( key );
		if ( cached ) {
			setData( cached );
			return;
		}
		let cancelled = false;
		const ids = key.split( ',' ).map( Number );
		fetchEpisodeStats( ids ).then( result => {
			if ( ! cancelled ) {
				cache.set( key, result );
				setData( result );
			}
		} );
		return () => {
			cancelled = true;
		};
	}, [ key ] );

	return { data };
}
