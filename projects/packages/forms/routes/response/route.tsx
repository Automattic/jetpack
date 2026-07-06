/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';

export const route = {
	/**
	 * Preloads the single feedback response before the route renders.
	 *
	 * Fetches with `fields_format: 'collection'` so the field renderers receive
	 * the same shape they get from the responses list loader.
	 *
	 * @param props                   - Loader props.
	 * @param props.params            - Route params.
	 * @param props.params.responseId - The response ID from the path.
	 */
	loader: async ( { params }: { params: { responseId?: string } } ) => {
		const id = Number( params.responseId );

		if ( Number.isFinite( id ) && id > 0 ) {
			try {
				await resolveSelect( 'core' ).getEntityRecord( 'postType', 'feedback', id, {
					fields_format: 'collection',
				} );
			} catch {
				// Swallow fetch errors (e.g. 404 for a missing response) so the stage
				// can render its own "not found" state instead of the router error boundary.
			}
		}
	},
};
