import { getScriptData } from '@automattic/jetpack-script-data';
import { decodeEntities } from '@wordpress/html-entities';

// Shape of the site identity the server bootstraps onto
// `window.JetpackScriptData.seo.site` (see `Dashboard_Data::get_site_data()`).
// Used to render the homepage search/social previews on the Settings tab.
export interface SiteData {
	title: string;
	tagline: string;
	url: string;
	icon: string;
	image: string;
}

interface SeoScriptData {
	seo?: { site?: SiteData };
}

// One decoded copy per bootstrapped object, so callers that memoize on the
// returned site get the same reference on every render.
const decoded = new WeakMap< SiteData, SiteData >();

/**
 * Read the bootstrapped site identity. Returns null if it isn't present (e.g.
 * an unbuilt or unexpected page state), so callers can skip the previews.
 *
 * WordPress stores the site title and tagline HTML-escaped (`Bob&#039;s blog`),
 * and they arrive as stored. They are decoded here so the previews show the
 * text a visitor sees.
 *
 * @return The site data, or null.
 */
export default function getSite(): SiteData | null {
	const site = ( getScriptData() as SeoScriptData )?.seo?.site;
	if ( ! site ) {
		return null;
	}

	let result = decoded.get( site );
	if ( ! result ) {
		result = {
			...site,
			title: decodeEntities( site.title ),
			tagline: decodeEntities( site.tagline ),
		};
		decoded.set( site, result );
	}
	return result;
}
