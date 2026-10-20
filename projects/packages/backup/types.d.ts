// Type-only import: loads the connection package's ambient declarations
// (`window.JP_CONNECTION_INITIAL_STATE`) without bundling the barrel.
import '@automattic/jetpack-connection';

declare global {
	interface Window {
		/** Emitted by `Jetpack_Backup::render_connection_initial_state()`. */
		JPBACKUP_DASHBOARD_STATE?: {
			activityLogUrl?: string | null;
		};
	}
}
