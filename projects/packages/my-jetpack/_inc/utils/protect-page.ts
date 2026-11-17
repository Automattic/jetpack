import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { select } from '@wordpress/data';
import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';

/**
 * Where the Protect page offers a Jetpack security module's settings, so other screens link there instead.
 *
 * @param slug - The module slug, such as `waf`.
 * @return The Protect page URL, or undefined when that page doesn't own the module.
 */
export function getProtectPageUrl( slug: string ): string | undefined {
	const url = getMyJetpackWindowInitialState( 'protectPageModuleUrls' )?.[ slug ];
	if ( ! url ) {
		return undefined;
	}

	// The map is from page load; switching the Protect row off since then removes the page.
	const modules = select( modulesStore );
	const dashboard = modules.hasFinishedResolution( 'getJetpackModules' )
		? modules.getJetpackModules()?.[ 'protect-dashboard' ]
		: undefined;

	return dashboard?.activated === false ? undefined : url;
}
