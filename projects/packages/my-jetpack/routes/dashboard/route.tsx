import { redirect } from '@wordpress/route';
import { getLegacyHashHref } from '../../_inc/utils/route-href';

export const route = {
	/**
	 * Sends a `#/…` link from before the boot router to the route it names, keeping its query.
	 *
	 * Runs on every navigation, so an in-page `#/add-backup` anchor is redirected too.
	 */
	beforeLoad: () => {
		const href = getLegacyHashHref( window.location.hash );

		if ( href ) {
			throw redirect( { href, replace: true } );
		}
	},

	/**
	 * Show the inspector while a feature is open on the Features tab.
	 *
	 * @param props        - The route's state.
	 * @param props.params - The path parameters.
	 * @param props.search - The search parameters.
	 * @return Whether to show the inspector.
	 */
	inspector: ( {
		params,
		search,
	}: {
		params: Record< string, unknown >;
		search: Record< string, unknown >;
	} ) => params?._splat === 'features' && Boolean( search?.feature ),
};
