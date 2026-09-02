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
	 * Starts loading the single feedback response as the route is entered.
	 *
	 * Uses the same collection query the stage reads through, so it populates the
	 * exact cache entry the page then selects from.
	 *
	 * Deliberately **not** awaited. The router blocks navigation on a loader that
	 * returns a promise, which made opening a response from the list sit on the list
	 * for a whole round trip before anything moved — even though the list had
	 * already loaded that response. Kicking the request off and returning
	 * immediately means navigation is instant and the stage renders from the list's
	 * copy while this lands.
	 *
	 * @param props                   - Loader props.
	 * @param props.params            - Route params.
	 * @param props.params.responseId - The response ID from the path.
	 */
	loader: ( { params }: { params: { responseId?: string } } ) => {
		const id = Number( params.responseId );

		if ( Number.isFinite( id ) && id > 0 ) {
			// Swallow fetch errors (e.g. 404 for a missing response) so the stage can
			// render its own "not found" state instead of the router error boundary.
			resolveSelect( 'core' )
				.getEntityRecords( 'postType', 'feedback', getResponseQuery( id ) )
				.catch( () => {} );
		}
	},
};
