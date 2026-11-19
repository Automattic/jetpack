import getOverview from './get-overview';

/**
 * Whether the `seo-tools` Jetpack module is active for this site.
 *
 * Reads the `seo_tools_active` signal from the Overview slice, which the server
 * bootstraps on every SEO route (see `Admin_Page::inject_script_data()`), so
 * any tab can gate its controls synchronously without loading its own data.
 *
 * Treats a missing bootstrap as inactive, so SEO-dependent controls stay hidden
 * until the module state is known. Independent settings remain available.
 *
 * @return Whether the `seo-tools` module is active.
 */
export default function isSeoToolsActive(): boolean {
	return getOverview()?.site_visibility.seo_tools_active ?? false;
}
