import { getSiteData } from '@automattic/jetpack-script-data';
import { useEffect, useState } from '@wordpress/element';
import wpcomRequest from 'wpcom-proxy-request';
import { resolveSelectionRange } from './range';
import type {
	PodcastEpisodeDetailStats,
	PodcastEpisodeDetailStatsResponse,
	PodcastStatsSelection,
} from './types';

/**
 * Per-episode stats query.
 *
 * @param postId    - Episode post ID, or null when no episode is selected.
 * @param selection - Stats selection.
 * @return          Query result.
 */
export function useEpisodeDetailStatsQuery(
	postId: number | null,
	selection: PodcastStatsSelection
): { data?: PodcastEpisodeDetailStats; isLoading: boolean; isError: boolean } {
	const [ data, setData ] = useState< PodcastEpisodeDetailStats | undefined >();
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isError, setIsError ] = useState( false );

	const { period } = selection;
	const { from, to } = resolveSelectionRange( selection );

	useEffect( () => {
		const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
		if ( ! blogId || ! postId ) {
			setData( undefined );
			setIsLoading( false );
			setIsError( false );
			return;
		}

		let cancelled = false;
		setIsLoading( true );
		setIsError( false );

		wpcomRequest< PodcastEpisodeDetailStatsResponse >( {
			path: `/sites/${ blogId }/podcast-stats/episode/${ postId }`,
			apiNamespace: 'wpcom/v2',
			query: new URLSearchParams( { from, to } ).toString(),
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
	}, [ postId, period, from, to ] );

	return { data, isLoading, isError };
}
