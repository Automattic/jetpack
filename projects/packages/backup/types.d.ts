declare module '*.svg' {
	const content: string;
	export default content;
}

interface Window {
	/** Emitted by `Jetpack_Backup::render_connection_initial_state()`. */
	JPBACKUP_DASHBOARD_STATE?: {
		activityLogUrl?: string | null;
	};
}
