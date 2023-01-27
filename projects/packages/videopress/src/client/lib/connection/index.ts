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

	const isConnected = initialState?.connectionStatus?.isUserConnected;
	if ( isConnected ) {
		debug( 'Jetpack user is connected ✅' );
		return true;
	}

	debug( 'User is not connected ❌' );

	return false;
}
