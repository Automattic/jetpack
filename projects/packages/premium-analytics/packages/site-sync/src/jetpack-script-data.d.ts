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
			// Whether the reader may see Stats reports; a shop manager may see only the store's.
			can_view_stats?: boolean;
			// Where switching the dashboard off lands: the classic Stats page, or null while no plugin registers one.
			classic_stats_url?: string | null;
			// Slugs of the tabs the dashboard exposes. Absent until the section registry is hydrated.
			sections?: string[];
			// Slugs of the tabs whose dates follow the plan's Stats limits. Absent with `sections`.
			plan_date_limited_sections?: string[];
			// The WooCommerce store currency, set by the WooCommerce stats package; absent without WooCommerce.
			store_currency?: { code: string; symbol: string; precision?: number };
			// The roles the Stats settings list, the screen that switches Stats on and off, and the visitor consent setup; absent for users who cannot manage options.
			stats_settings?: {
				roles: Array< { slug: string; name: string; count: number | null } >;
				features_url: string | null;
				consent?: {
					api_active: boolean;
					api_installed: boolean;
					consent_type_declared: boolean;
					banner_plugin: string | null;
					// The banner plugin holds the Stats script itself until visitors allow it, as Complianz's Jetpack integration does.
					banner_blocks_stats: boolean;
					recommended_banners: Array< { name: string; url: string } >;
					can_install: boolean;
					can_activate: boolean;
					file_mods_allowed: boolean;
				};
			};
			// The Stats features the site's plan lacks, each with its copy and upgrade URL (empty when there is nowhere to buy it), and the widget types they lock. Dashboard only.
			plan_gates?: {
				tier: string;
				locked_features: Record<
					string,
					{ description: string; support_url: string; upgrade_url: string }
				>;
				locked_widget_types: Record< string, string >;
				// Absent from servers that predate section gates.
				locked_sections?: Record<
					string,
					{
						title: string;
						description: string;
						description_with_price: `${ string }%s${ string }`;
						features: string[];
						upgrade_label: string;
						expand_label: string;
						support_url: string;
						upgrade_url: string;
						open_widget_types: string[];
						plan_price: { yearly: number; currency: string } | null;
					}
				>;
				// The paid plan offer the banner shows, or null when the site does not qualify (see docs/dashboard-widgets.md). The URL is empty when there is nowhere to buy it, and `has_stats_product` says whether the site has the free Jetpack Stats product.
				free_site_upgrade?: { upgrade_url: string; has_stats_product: boolean } | null;
			};
			// URL of the dashboard's copied `build/images/` directory, with a trailing slash. Dashboard only.
			assets_url?: string;
			// The Stats purchase this page load returned from checkout with; absent on every other load.
			purchase_success?: { type: 'paid' | 'free' };
		};
		newsletter?: {
			// The Newsletter page's Subscribers tab; null when this user cannot open it.
			subscribersUrl?: string | null;
		};
	}
}
