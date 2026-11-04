import { redirect } from '@wordpress/route';
import { getLegacyHashHref } from '../../_inc/utils/route-href';
import { isSettingsConsolidationEnabled } from '../../_inc/utils/settings-consolidation';

export const route = {
	/**
	 * Opens the settings panel for `?configure=<slug>`, only while settings consolidation is on.
	 *
	 * @param props        - Loader props.
	 * @param props.search - The route's search values.
	 * @return Whether to show the inspector.
	 */
	inspector: ( { search }: { search: Record< string, unknown > } ) =>
		isSettingsConsolidationEnabled() && String( search?.configure ?? '' ) !== '',

	/**
	 * Sends a `#/…` link to the route it names, keeping its query.
	 *
	 * Permanent: My Jetpack's PHP, other plugins, Calypso and wpcom all link with `#/…`, at any version.
	 * Runs on every navigation, so an in-page `#/add-backup` anchor is redirected too.
	 */
	beforeLoad: () => {
		const href = getLegacyHashHref( window.location.hash );

		if ( href ) {
			throw redirect( { href, replace: true } );
		}
	},
};
