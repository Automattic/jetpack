import { ExternalLink } from '@wordpress/components';

interface Props {
	// The site's front-end URL, from the composite read. When absent (older
	// reads, dev fixtures) the preview is omitted entirely.
	siteUrl: string | null;
	// The site name; falls back to the domain when absent.
	siteTitle?: string | null;
}

/**
 * Build the mShots thumbnail URL for a site's front end. mShots renders the
 * live page server-side and caches it; the first hit may return a "generating"
 * placeholder that resolves on a later load — acceptable for this preview (the
 * legacy launchpad widget relies on the same endpoint).
 *
 * @param siteUrl - The site's front-end URL.
 * @return The mShots image URL (rendered at 2x the displayed width for retina).
 */
function mshotsUrl( siteUrl: string ): string {
	return `https://s0.wp.com/mshots/v1/${ encodeURIComponent( siteUrl ) }?w=700`;
}

/**
 * The site-preview card shown to the right of the tailored list: an mShots
 * thumbnail of the site's front end, the site name, and a link to the site.
 * Rendered in both the loading and loaded states so the layout is stable across
 * the wizard→tailoring→list transition. Returns nothing when the site URL is
 * unknown (e.g. dev fixtures), so the list still renders without it.
 *
 * @param props           - Component props.
 * @param props.siteUrl   - The site's front-end URL.
 * @param props.siteTitle - The site name (falls back to the domain).
 * @return The preview element, or null when there's no site URL.
 */
export function SitePreview( { siteUrl, siteTitle }: Props ) {
	if ( ! siteUrl ) {
		return null;
	}

	let domain = siteUrl;
	try {
		domain = new URL( siteUrl ).host;
	} catch {
		// A malformed home URL still renders: fall back to the raw string.
	}

	return (
		<aside className="ai-launchpad-tailored-list__preview">
			<div className="ai-launchpad-tailored-list__preview-frame">
				<img
					className="ai-launchpad-tailored-list__preview-image"
					src={ mshotsUrl( siteUrl ) }
					alt=""
					loading="lazy"
				/>
			</div>
			<p className="ai-launchpad-tailored-list__preview-title">{ siteTitle || domain }</p>
			<ExternalLink className="ai-launchpad-tailored-list__preview-link" href={ siteUrl }>
				{ domain }
			</ExternalLink>
		</aside>
	);
}
