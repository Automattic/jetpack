import { getScriptData } from '@automattic/jetpack-script-data';

// Shape of the site identity the server bootstraps onto
// `window.JetpackScriptData.seo.site` (see `Initializer::get_site_data()`).
// Used to render the homepage search/social previews on the Settings tab.
export interface SiteData {
	title: string;
	url: string;
	icon: string;
	image: string;
}

interface SeoScriptData {
	seo?: { site?: SiteData };
}

/**
 * Read the bootstrapped site identity. Returns null if it isn't present (e.g.
 * an unbuilt or unexpected page state), so callers can skip the previews.
 *
 * @return The site data, or null.
 */
export default function getSite(): SiteData | null {
	return ( getScriptData() as SeoScriptData )?.seo?.site ?? null;
}
