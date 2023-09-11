export const JETPACK_DATA_PATH = 'Jetpack_Editor_Initial_State';

/**
 * Retrieves Jetpack editor state
 *
 * @returns {object|null}Object The Jetpack Editor State.
 */
export default function getJetpackData() {
	return 'object' === typeof window ? window?.[ JETPACK_DATA_PATH ] ?? null : null;
}
