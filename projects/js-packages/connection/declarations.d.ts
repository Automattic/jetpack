import { ConnectionScriptData } from './types';

// Use module augmentation to add the social property to JetpackInitialState
declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		connection: ConnectionScriptData;
	}
}
