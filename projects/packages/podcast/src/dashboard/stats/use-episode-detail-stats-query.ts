import { getSiteData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { getStatsDateRange } from './range';
import type {
	PodcastEpisodeDetailStats,
	PodcastEpisodeDetailStatsResponse,
	PodcastStatsPeriod,
} from './types';

/**
 * Per-episode stats query.
 *
 * @param postId - Episode post ID, or null when no episode is selected.
 * @param period - Stats period.
 * @return       Query result.
 */
export function useEpisodeDetailStatsQuery(
	postId: number | null,
	period: PodcastStatsPeriod = '30d'
): { data?: PodcastEpisodeDetailStats; isLoading: boolean; isError: boolean } {
	const [ data, setData ] = useState< PodcastEpisodeDetailStats | undefined >();
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isError, setIsError ] = useState( false );

	useEffect( () => {
		const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
		if ( ! blogId || ! postId ) {
			setData( undefined );
			setIsLoading( false );
			setIsError( false );
			return;
		}

		const range = getStatsDateRange( period );
		let cancelled = false;
		setIsLoading( true );
		setIsError( false );

		apiFetch< PodcastEpisodeDetailStatsResponse >( {
			path: addQueryArgs( `/wpcom/v2/sites/${ blogId }/podcast-stats/episode/${ postId }`, {
				from: range.from,
				to: range.to,
			} ),
			method: 'GET',
		} )
			.then( response => {
				if ( ! cancelled ) {
					setData( { ...response, period } );
					setIsLoading( false );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setIsError( true );
					setIsLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ postId, period ] );

	return { data, isLoading, isError };
}
