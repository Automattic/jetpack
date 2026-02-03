/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_NAME as FORM_RESPONSES_STORE_NAME } from '../../src/dashboard/store/index.js';

const NON_TRASH_FORM_STATUSES = 'publish,draft,pending,future,private';

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
	inspector: async ( { search }: { search: { responseIds?: string[] } } ) => {
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
		} );

		// Preload global inbox/spam/trash counts (used by the top header tabs).
		await resolveSelect( FORM_RESPONSES_STORE_NAME ).getCounts();

		// Preload global non-trash forms count (used by the top header tabs).
		await resolveSelect( 'core' ).getEntityRecords( 'postType', 'jetpack_form', {
			context: 'edit',
			jetpack_forms_context: 'dashboard',
			order: 'desc',
			orderby: 'modified',
			page: 1,
			per_page: 1,
			status: NON_TRASH_FORM_STATUSES,
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
			await resolveSelect( 'core' ).getPostType( 'feedback' );
		} catch {
			// Post type doesn't exist - Jetpack Forms not active
			// For now, we'll let it fail gracefully in the component
		}
	},
};
