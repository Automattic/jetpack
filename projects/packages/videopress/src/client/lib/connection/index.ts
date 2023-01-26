// Get connection initial state from the global window object.
const initialState = window?.JP_CONNECTION_INITIAL_STATE;

/**
 * Return the initial connection status.
 * It relies on the JP_CONNECTION_INITIAL_STATE and
 * videoPressEditorState globals variable,
 * both exposed by the connection class-block-editor-extension.php.
 *
 * @see {@link class-block-editor-extension.php}
 * @returns {boolean} True if the user is connected, false otherwise.
 */
export function isUserConnected(): boolean {
	// Get site type.
	const { siteType = '' } = window?.videoPressEditorState || {};

	if ( siteType === 'simple' ) {
		return true;
	}

	return initialState?.connectionStatus?.isUserConnected;
}
