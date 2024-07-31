import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';

/**
 * Check if the Jetpack plugin is active or not.
 *
 * @returns {boolean} Returns true if the Jetpack plugin is active, otherwise false.
 */
export const isJetpackPluginActive = () => {
	const { plugins } = getMyJetpackWindowInitialState() || {};
	const jetpackPlugin = Object.values( plugins ).find( plugin => plugin?.Name === 'Jetpack' );

	return jetpackPlugin && jetpackPlugin.active;
};
