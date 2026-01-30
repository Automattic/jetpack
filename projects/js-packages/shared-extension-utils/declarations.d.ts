import type { ConnectionScriptData } from '@automattic/jetpack-connection';

interface Window {
	JP_CONNECTION_INITIAL_STATE: ConnectionScriptData;
}
