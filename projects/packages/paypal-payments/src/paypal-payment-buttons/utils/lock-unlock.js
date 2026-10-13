/**
 * PayPal Payment Buttons - Unlocks core's private block editor APIs.
 *
 * Opts in on the first unlock. If core refuses the opt-in or the unlock, e.g.
 * after a consent change, it logs an error once and every unlock returns an
 * empty object.
 *
 * @package
 */

import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

let privateApis;

/**
 * Unlock a core object's private APIs.
 *
 * @param {object} object - Locked object, e.g. a store's dispatch.
 * @return {object} Its private APIs, or an empty object if core refused.
 */
export function unlock( object ) {
	try {
		if ( ! privateApis ) {
			privateApis = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
				'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
				'@wordpress/block-editor'
			);
		}
		return privateApis.unlock( object );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Error: Unable to unlock the private block editor APIs. Reason: %s', error );
		privateApis = { unlock: () => ( {} ) };
		return {};
	}
}
