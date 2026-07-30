import { getScriptData } from '@automattic/jetpack-script-data';

// Shape of the plan-gating slice the server bootstraps onto
// `window.JetpackScriptData.seo.gating` (see `Initializer::inject_script_data()`).
interface GatingData {
	is_gated: boolean;
	upsell_url: string;
}

interface SeoScriptData {
	seo?: { gating?: GatingData };
}

/**
 * The bootstrapped plan-gating slice, or `undefined` when it isn't present.
 *
 * @return The gating slice.
 */
function getGating(): GatingData | undefined {
	return ( getScriptData() as SeoScriptData )?.seo?.gating;
}

/**
 * Whether the SEO dashboard is plan-gated for this site (a below-Premium
 * WordPress.com site). When gated the dashboard reduces to a free subset and
 * surfaces the upsell banner; self-hosted is never gated.
 *
 * Defaults to `false` (ungated) when the bootstrap slice is missing — ungated is
 * the safe default, so a paying user is never shown a reduced experience because
 * of a stale or incomplete page snapshot.
 *
 * @return Whether the dashboard is gated.
 */
export function isGated(): boolean {
	return getGating()?.is_gated ?? false;
}

/**
 * The WordPress.com Premium checkout URL the upsell banner links to, bootstrapped
 * server-side (the client doesn't have the site slug). Empty string when absent.
 *
 * @return The upsell URL.
 */
export function getUpsellUrl(): string {
	return getGating()?.upsell_url ?? '';
}
