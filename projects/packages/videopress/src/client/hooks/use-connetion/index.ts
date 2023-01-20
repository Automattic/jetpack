/**
 * Types
 */
import type { UseConnection } from './types';

const { videoPressEditorState } = window;

/**
 * React hook with the connection state
 * Althought the state is static,
 * let's create the hook to keep the same pattern.
 *
 * @returns {UseConnection} Connection state
 */
export default function useConnection(): UseConnection {
	return {
		isUserConnected: videoPressEditorState?.isUserConnected === '1',
	};
}
