/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';

export const route = {
	/**
	 * Determines when to show the inspector panel.
	 * Only show when a single response is selected.
	 * @param root0
	 * @param root0.search
	 * @param root0.search.responseIds
	 */
	inspector: async ( {
		search,
	}: {
		search: { responseIds?: string[] };
	} ) => {
		return !! ( search?.responseIds && search.responseIds.length === 1 );
	},

	/**
	 * Preloads data before the route renders.
	 * @param root0
	 * @param root0.params
	 * @param root0.params.view
	 * @param root0.search
	 * @param root0.search.page
	 */
	loader: async ( {
		params,
		search,
	}: {
		params: { view?: string };
		search: { page?: number };
	} ) => {
		const status = params.view === 'spam' ? 'spam' : params.view === 'trash' ? 'trash' : 'publish';

		// Preload feedback responses
		await resolveSelect( coreStore ).getEntityRecords( 'postType', 'feedback', {
			per_page: 20,
			page: search.page || 1,
			status,
			orderby: 'date',
			order: 'desc',
		} );
	},

	/**
	 * Validates that the route can be accessed.
	 * Checks if the feedback post type exists.
	 */
	beforeLoad: async () => {
		// The feedback post type is registered by Jetpack Forms
		// This will throw notFound() if the post type doesn't exist
		try {
			await resolveSelect( coreStore ).getPostType( 'feedback' );
		} catch {
			// Post type doesn't exist - Jetpack Forms not active
			// For now, we'll let it fail gracefully in the component
		}
	},
};
