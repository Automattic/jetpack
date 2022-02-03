/**
 * External Dependencies
 */
import { get } from 'lodash';

export const JETPACK_DATA_PATH = 'Jetpack_Editor_Initial_State';

/**
 * Retrieves Jetpack editor state
 *
 * @returns {object|null}Object The Jetpack Editor State.
 */
export default function getJetpackData() {
	return get( 'object' === typeof window ? window : null, [ JETPACK_DATA_PATH ], null );
}
