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
			// Whether the site has store data to sync (WooCommerce active). When
			// false the dashboard waits on Jetpack's generic initial full sync
			// instead of the woocommerce_analytics module.
			has_store_data: boolean;
		};
	}
}
