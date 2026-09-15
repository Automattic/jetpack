import { SERVER_OBJECT_NAME } from '../../lib/constants';
import { normalizeWidgets } from '../../lib/widgets';

/**
 * Builds the initial serverOptions state from the localized server object,
 * normalizing the widget config so a missing or malformed value doesn't
 * crash selectors that assume it's an array of well-formed widgets.
 *
 * @return {object} Initial serverOptions state.
 */
function getInitialServerOptions() {
	const serverObject = window[ SERVER_OBJECT_NAME ] ?? {};
	return {
		...serverObject,
		widgets: normalizeWidgets( serverObject.widgets ),
		widgetsOutsideOverlay: normalizeWidgets( serverObject.widgetsOutsideOverlay ),
	};
}

/**
 * Reducer for storing server-generated values in the Redux store.
 *
 * @param {object} state - Current state.
 * @return {object} Updated state.
 */
export function serverOptions( state = getInitialServerOptions() ) {
	return state;
}
