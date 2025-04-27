import { ConnectionScriptData } from './types';

// Use module augmentation to add the social property to JetpackInitialState
declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		connection: ConnectionScriptData;
	}
}

declare global {
	interface Window {
		/**
		 * @deprecated In favor of getScriptData from @automattic/jetpack-script-data
		 */
		JP_CONNECTION_INITIAL_STATE: ConnectionScriptData;
	}
}
