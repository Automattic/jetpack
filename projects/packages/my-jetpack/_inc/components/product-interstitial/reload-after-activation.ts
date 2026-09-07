import { __, sprintf } from '@wordpress/i18n';
import { PRODUCTS_NEEDING_RELOAD_AFTER_TOGGLE } from '../../constants';
import { setPendingSuccessNotice } from '../my-jetpack-tab-panel/products/pending-notice';
import { loadMyJetpackHomePage } from '../my-jetpack-tab-panel/products/reload-page';

/**
 * Start a full page load back to the My Jetpack overview after activating a
 * product that changes server-rendered wp-admin UI, such as sidebar menu items
 * (e.g. the "Jetpack > VideoPress" item links to the VideoPress library only
 * once the module is active). A client-side navigation would keep the stale
 * pre-activation markup, so those products must leave the app through a real
 * page load. The success notice is persisted so it survives the reload.
 *
 * @param {string} slug        - The slug of the product that was activated.
 * @param {string} productName - The product name used in the success notice.
 * @return {boolean} Whether a page load was started. When true, callers must skip their client-side navigation fallback.
 */
export function reloadIfActivationChangesAdminMenu( slug: string, productName?: string ): boolean {
	if ( ! PRODUCTS_NEEDING_RELOAD_AFTER_TOGGLE.includes( slug ) ) {
		return false;
	}

	setPendingSuccessNotice(
		sprintf(
			/* translators: %s is the product name, i.e.- "Jetpack VideoPress". */
			__( '%s activated successfully!', 'jetpack-my-jetpack' ),
			productName
		)
	);
	loadMyJetpackHomePage();

	return true;
}
