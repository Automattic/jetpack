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
			// Whether the dashboard offers adding, removing and resetting widgets: the
			// premium-analytics-dashboard-composition feature flag, read by the policy.
			dashboard_composition_enabled?: boolean;
			// Whether the reader may see Stats reports; a shop manager may see only the store's.
			can_view_stats?: boolean;
			// Slugs of the tabs the dashboard exposes. Absent until the section registry is hydrated.
			sections?: string[];
			// The WooCommerce store currency, set by the WooCommerce stats package; absent without WooCommerce.
			store_currency?: { code: string; symbol: string };
		};
		newsletter?: {
			// The Newsletter page's Subscribers tab; null when this user cannot open it.
			subscribersUrl?: string | null;
		};
	}
}
