/**
 * The backend `Sync_Status_Tracker` (jetpack PR #49211) injects this block into
 * `window.JetpackScriptData` via the `jetpack_admin_js_script_data` filter. The
 * base `@automattic/jetpack-script-data` types don't know about it, so augment.
 */
import '@automattic/jetpack-script-data';

declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		premium_analytics?: {
			initial_full_sync_finished: number;
			// Whether CSV export controls should render. Defaults to true server-side.
			csv_exports_enabled?: boolean;
			// Whether the site runs VideoPress, which gates the video surfaces.
			has_videopress?: boolean;
			// Whether the current user is an Automattician, which the dashboard policy reads.
			is_automattician?: boolean;
		};
	}
}
