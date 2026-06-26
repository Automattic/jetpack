import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';

/**
 * Whether the My Jetpack page is in the flagged "products-only" mode.
 *
 * In this mode the site cannot manage Jetpack modules, so the tabs, module toggles, and the
 * modules footer link are hidden. The flag lives in the nested myJetpackFlags object so it
 * survives wp_localize_script as a real boolean.
 *
 * @return {boolean} Whether the products-only mode is active.
 */
export const isProductsOnlyMode = () =>
	getMyJetpackWindowInitialState( 'myJetpackFlags' )?.productsOnly === true;
