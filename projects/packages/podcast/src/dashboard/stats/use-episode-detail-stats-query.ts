import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
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
		if ( ! postId ) {
			setData( undefined );
			setIsLoading( false );
			setIsError( false );
			return;
		}

		let cancelled = false;
		setIsLoading( true );
		setIsError( false );

		apiFetch< PodcastEpisodeDetailStatsResponse >( {
			path: addQueryArgs( `/wpcom/v2/podcast-stats/episode/${ postId }`, { from, to } ),
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
