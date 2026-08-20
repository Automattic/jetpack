/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import getResponseQuery from './query.ts';

export const route = {
	/**
	 * Preloads the single feedback response before the route renders.
	 *
	 * Uses the same collection query the stage reads through, so the preload
	 * populates the exact cache entry the page then selects from.
	 *
	 * @param props                   - Loader props.
	 * @param props.params            - Route params.
	 * @param props.params.responseId - The response ID from the path.
	 */
	loader: async ( { params }: { params: { responseId?: string } } ) => {
		const id = Number( params.responseId );

		if ( Number.isFinite( id ) && id > 0 ) {
			try {
				await resolveSelect( 'core' ).getEntityRecords(
					'postType',
					'feedback',
					getResponseQuery( id )
				);
			} catch {
				// Swallow fetch errors (e.g. 404 for a missing response) so the stage
				// can render its own "not found" state instead of the router error boundary.
			}
		}
	},
};
