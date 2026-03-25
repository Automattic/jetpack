/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { preloadGlobalTabCounts } from '../../src/dashboard/wp-build/utils/preload';

export const route = {
	/**
	 * Determines when to show the inspector panel.
	 * Only show when a single response is selected.
	 * @param props                    - Props used while determining when to show the inspector panel.
	 * @param props.search             - The search parameters.
	 * @param props.search.responseIds - The IDs of the responses to show in the inspector panel.
	 *
	 * @return                         - Whether to show the inspector panel.
	 */
	inspector: ( { search }: { search: { responseIds?: string[] } } ) => {
		return !! ( search?.responseIds && search.responseIds.length === 1 );
	},

	/**
	 * Preloads data before the route renders.
	 * @param props             - Props used while preloading data before the route renders.
	 * @param props.params      - The parameters.
	 * @param props.params.view - The view.
	 * @param props.search      - The search parameters.
	 * @param props.search.page - The page number.
	 */
	loader: async ( {
		params,
		search,
	}: {
		params: { view?: string };
		search: { page?: number };
	} ) => {
		let status = 'publish';

		if ( params.view === 'spam' ) {
			status = 'spam';
		} else if ( params.view === 'trash' ) {
			status = 'trash';
		}

		// Preload feedback responses
		await resolveSelect( 'core' ).getEntityRecords( 'postType', 'feedback', {
			per_page: 20,
			page: search.page || 1,
			status,
			orderby: 'date',
			order: 'desc',
			fields_format: 'collection',
		} );

		// Preload global header tab counts.
		await preloadGlobalTabCounts();
	},

	/**
	 * Validates that the route can be accessed.
	 * Checks if the feedback post type exists.
	 */
	beforeLoad: async () => {
		// Redirect legacy hash from email links (e.g. #/responses?status=inbox&r=2879&mark_as_spam).
		// The hash survives server redirects but is never sent to the server, so we must
		// convert it client-side to the wp-build URL with responseIds in the path.
		const hash = window.location.hash;
		const legacyMatch = hash.match( /^#\/responses\?(.*)$/ );

		if ( legacyMatch ) {
			const params = new URLSearchParams( legacyMatch[ 1 ] );
			const r = params.get( 'r' );

			if ( r ) {
				const status = params.get( 'status' ) || 'inbox';
				const validStatuses = [ 'inbox', 'spam', 'trash' ];
				const view = validStatuses.includes( status ) ? status : 'inbox';
				const hasMarkAsSpam = params.has( 'mark_as_spam' );

				// Build redirect URL with mark_as_spam parameter if present
				let redirectUrl = `/responses/${ view }?responseIds=${ encodeURIComponent(
					JSON.stringify( [ r ] )
				) }`;
				if ( hasMarkAsSpam ) {
					redirectUrl += '&mark_as_spam=1';
				}

				throw redirect( {
					href: redirectUrl,
				} );
			}
		}

		// The feedback post type is registered by Jetpack Forms
		// This will throw notFound() if the post type doesn't exist
		try {
			await resolveSelect( 'core' ).getPostType( 'feedback' );
		} catch {
			// Post type doesn't exist - Jetpack Forms not active
			// For now, we'll let it fail gracefully in the component
		}
	},
};
