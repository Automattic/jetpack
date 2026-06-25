import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';

/**
 * Whether the current site can activate/deactivate Jetpack modules.
 *
 * In the products-only mode, Simple sites and Atomic sites without a business plan cannot, and
 * their module toggles are hidden. The flag lives in the nested myJetpackFlags object so it
 * survives wp_localize_script as a real boolean. Only an explicit `false` disables management,
 * so the standard My Jetpack UI is unaffected when the value is absent.
 *
 * @return {boolean} Whether module activate/deactivate toggles should be rendered.
 */
export const canManageModules = () =>
	getMyJetpackWindowInitialState( 'myJetpackFlags' )?.canManageModules !== false;
