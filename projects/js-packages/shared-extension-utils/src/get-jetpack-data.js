export const JETPACK_DATA_PATH = 'Jetpack_Editor_Initial_State';

/**
 * Retrieves Jetpack editor state
 *
 * @deprecated Use the consolidated initial state using `getScriptData` from `@automattic/jetpack-script-data` instead. Feel free to extend it if needed.
 *
 * @return {object|null} The Jetpack Editor State.
 */
export default function getJetpackData() {
	return 'object' === typeof window ? window?.[ JETPACK_DATA_PATH ] ?? null : null;
}
