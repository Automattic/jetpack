import { ExternalLink } from '@wordpress/components';

interface Props {
	// The site's front-end URL, from the composite read. When absent (older
	// reads, dev fixtures) the preview is omitted entirely.
	siteUrl: string | null;
	// The site name; falls back to the domain when absent.
	siteTitle?: string | null;
}

/**
 * The site-preview card shown to the right of the tailored list: a live,
 * scaled-down preview of the site's front end, the site name, and a link to the
 * site. The preview is a non-interactive iframe of the front end with the
 * banners/overlay hidden, mirroring the wp-admin dashboard's site-management
 * widget — it renders immediately rather than waiting on an mShots screenshot.
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
				<iframe
					className="ai-launchpad-tailored-list__preview-iframe"
					title={ siteTitle || domain }
					src={ `${ siteUrl }/?hide_banners=true&preview_overlay=true&preview=true` }
					inert="true"
					tabIndex={ -1 }
				/>
			</div>
			<p className="ai-launchpad-tailored-list__preview-title">{ siteTitle || domain }</p>
			<ExternalLink className="ai-launchpad-tailored-list__preview-link" href={ siteUrl }>
				{ domain }
			</ExternalLink>
		</aside>
	);
}
