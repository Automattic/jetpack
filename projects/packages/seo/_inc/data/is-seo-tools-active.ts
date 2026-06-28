import getOverview from './get-overview';

/**
 * Whether the `seo-tools` Jetpack module is active for this site.
 *
 * Reads the `seo_tools_active` signal from the Overview slice, which the server
 * bootstraps on every SEO route (see `Initializer::inject_script_data()`), so
 * any tab can gate its controls synchronously without loading its own data.
 *
 * Treats a missing bootstrap as inactive: the settings REST endpoints are only
 * registered when the module is active (`Initializer::init()`), so a tab should
 * never present editable-but-dead controls when the module state is unknown.
 *
 * @return Whether the `seo-tools` module is active.
 */
export default function isSeoToolsActive(): boolean {
	return getOverview()?.site_visibility.seo_tools_active ?? false;
}
