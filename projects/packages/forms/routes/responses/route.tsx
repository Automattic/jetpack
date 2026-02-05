/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { getJetpackFormCanvasData } from '../../src/dashboard/wp-build/utils/canvas-editor';
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

		// Preload global header tab counts.
		await preloadGlobalTabCounts();
	},

	/**
	 * Render the editor canvas when editing a form from the responses view.
	 *
	 * @param props                   - Route props.
	 * @param props.search            - Search params.
	 * @param props.search.editFormId - Form ID to edit.
	 * @return Canvas data or undefined.
	 */
	canvas: ( { search }: { search: { editFormId?: number | string } } ) =>
		getJetpackFormCanvasData( search.editFormId ),

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
