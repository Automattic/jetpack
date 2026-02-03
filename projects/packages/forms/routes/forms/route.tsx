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
	 * Preload data before the route renders.
	 */
	loader: async () => {
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
};
