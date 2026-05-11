import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

type EpisodePostResponse = {
	title?: { rendered?: string };
};

/**
 * Decoded episode title via the local-site `/wp/v2/posts/{id}` route, which
 * works on both Simple (wpcom-rest) and Atomic (native WP REST). The cross-
 * site `/sites/{blog}/posts/{id}` route isn't registered locally on Atomic.
 *
 * @param postId - Episode post ID, or null when no episode is selected.
 * @return       `{ data }` with the decoded title string when resolved.
 */
export function useEpisodeTitleQuery( postId: number | null ): { data?: string } {
	const [ data, setData ] = useState< string | undefined >();

	useEffect( () => {
		if ( ! postId ) {
			setData( undefined );
			return;
		}
		let cancelled = false;
		apiFetch< EpisodePostResponse >( {
			path: `/wp/v2/posts/${ postId }`,
			method: 'GET',
		} )
			.then( body => {
				if ( ! cancelled ) {
					setData( decodeEntities( body?.title?.rendered ?? '' ) );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setData( undefined );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ postId ] );

	return { data };
}
