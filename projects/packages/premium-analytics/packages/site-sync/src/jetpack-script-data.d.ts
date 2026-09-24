/**
 * The backend `Sync_Status_Tracker` (jetpack PR #49211) injects this block into
 * `window.JetpackScriptData` via the `jetpack_admin_js_script_data` filter. The
 * base `@automattic/jetpack-script-data` types don't know about it, so augment.
 * Other packages merge the fields they read into `PremiumAnalyticsScriptData`.
 */
import '@automattic/jetpack-script-data';

declare module '@automattic/jetpack-script-data' {
	interface PremiumAnalyticsScriptData {
		initial_full_sync_finished: number;
		// Whether the site runs VideoPress, which gates the video surfaces.
		has_videopress?: boolean;
		// Whether the dashboard offers adding, removing and resetting widgets: the
		// premium-analytics-dashboard-composition feature flag, read by the policy.
		dashboard_composition_enabled?: boolean;
		// Slugs of the tabs the dashboard exposes. Absent until the section registry is hydrated.
		preview_sections?: string[];
	}

	interface JetpackScriptData {
		premium_analytics?: PremiumAnalyticsScriptData;
		newsletter?: {
			// The Newsletter page's Subscribers tab; null when this user cannot open it.
			subscribersUrl?: string | null;
		};
	}
}
