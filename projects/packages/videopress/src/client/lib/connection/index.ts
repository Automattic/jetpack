/**
 * External dependencies
 */
import debugFactory from 'debug';

// Get connection initial state from the global window object.
const initialState = window?.JP_CONNECTION_INITIAL_STATE;

const { siteType = '' } = window?.videoPressEditorState || {};

const debug = debugFactory( 'videopress:connection' );

/**
 * Return the initial connection status.
 * It relies on the JP_CONNECTION_INITIAL_STATE and
 * videoPressEditorState globals variable,
 * both exposed by the connection class-block-editor-extension.php.
 *
 * @see {@link ../class-block-editor-extension.php}
 * @returns {boolean} True if the user is connected, false otherwise.
 */
export function isUserConnected(): boolean {
	if ( siteType === 'simple' ) {
		debug( 'Simple site connected ✅' );
		return true;
	}

	if ( initialState?.connectionStatus?.isUserConnected ) {
		debug( 'Jetpack user is connected ✅' );
		return true;
	}

	debug( 'User is not connected ❌' );
	return false;
}

/**
 * Check whether the Jetpack VideoPress module is active.
 *
 * @returns {boolean} True if the module is active, false otherwise.
 */
export function isVideoPressModuleActive(): boolean {
	return window?.videoPressEditorState?.isVideoPressModuleActive === '1';
}

/**
 * Return whether the VideoPress feature is active,
 * considering the user connection status
 * and also the module status.
 *
 * Note: It's possible to have the module active,
 * but the user not connected.
 *
 * @returns {boolean} True if the feature is active, false otherwise.
 */
export function isVideoPressActive(): boolean {
	if ( ! isUserConnected() ) {
		return false;
	}

	return isVideoPressModuleActive() || isStandaloneActive();
}

/**
 * Return whether the standalone plugin is active.
 *
 * @returns {boolean} True if the feature is active, false otherwise.
 */
export function isStandaloneActive(): boolean {
	return window?.videoPressEditorState?.isStandaloneActive === '1';
}
