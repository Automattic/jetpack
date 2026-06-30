import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import type { ReactNode } from 'react';

interface Props {
	// The site's front-end URL. When absent the preview is omitted entirely.
	siteUrl: string | null;
	// The site name; falls back to the domain when absent.
	siteTitle?: string | null;
	// The appearance-editor URL. When present the thumbnail becomes a quick link.
	siteEditUrl?: string | null;
}

/**
 * The site-preview card shown to the right of the tailored list: a scaled-down
 * iframe of the site's front end, the site name, and a link to the site. When an
 * editor URL is known the thumbnail doubles as a quick link with a hover "Edit
 * site" overlay. Returns null when the site URL is unknown.
 *
 * @param props             - Component props.
 * @param props.siteUrl     - The site's front-end URL.
 * @param props.siteTitle   - The site name (falls back to the domain).
 * @param props.siteEditUrl - The Site Editor URL (makes the thumbnail a quick link).
 * @return The preview element, or null when there's no site URL.
 */
export function SitePreview( { siteUrl, siteTitle, siteEditUrl }: Props ) {
	if ( ! siteUrl ) {
		return null;
	}

	let domain = siteUrl;
	try {
		domain = new URL( siteUrl ).host;
	} catch {
		// A malformed home URL still renders: fall back to the raw string.
	}

	const thumbnail = (
		<iframe
			className="ai-launchpad-tailored-list__preview-iframe"
			title={ siteTitle || domain }
			src={ `${ siteUrl }/?hide_banners=true&preview_overlay=true&preview=true` }
			inert="true"
			tabIndex={ -1 }
		/>
	);

	// With a known editor URL the thumbnail reveals an "Edit site" button on
	// hover/focus; otherwise it stays a plain thumbnail.
	let frame: ReactNode;
	if ( siteEditUrl ) {
		frame = (
			<div className="ai-launchpad-tailored-list__preview-frame is-editable">
				{ thumbnail }
				<span className="ai-launchpad-tailored-list__preview-edit">
					<Button variant="solid" size="compact" render={ <a href={ siteEditUrl } /> }>
						{ __( 'Edit site', 'jetpack-mu-wpcom' ) }
					</Button>
				</span>
			</div>
		);
	} else {
		frame = <div className="ai-launchpad-tailored-list__preview-frame">{ thumbnail }</div>;
	}

	return (
		<aside className="ai-launchpad-tailored-list__preview">
			{ frame }
			<p className="ai-launchpad-tailored-list__preview-title">{ siteTitle || domain }</p>
			<ExternalLink className="ai-launchpad-tailored-list__preview-link" href={ siteUrl }>
				{ domain }
			</ExternalLink>
		</aside>
	);
}
