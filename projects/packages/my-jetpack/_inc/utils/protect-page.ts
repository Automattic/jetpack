import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';

/**
 * Where the Protect page offers a Jetpack security module's settings, so other screens link there instead.
 *
 * @param slug - The module slug, such as `waf`.
 * @return The Protect page URL, or undefined when that page doesn't own the module.
 */
export function getProtectPageUrl( slug: string ): string | undefined {
	return getMyJetpackWindowInitialState( 'protectPageModuleUrls' )?.[ slug ];
}
