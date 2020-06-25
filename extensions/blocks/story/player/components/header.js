/**
 * External dependencies
 */
import { html } from 'htm/preact';

/**
 * Internal dependencies
 */
import { SimpleButton } from './button';

export default function Header( {
	fullscreen,
	onExitFullscreen,
	siteDescription,
	siteIconUrl,
	siteName,
} ) {
	if ( ! fullscreen ) {
		return null;
	}

	// TODO: replace this monstruosity (url relative to story/view.js)
	siteIconUrl = siteIconUrl || '../../../../../../wp-includes/images/w-logo-blue.png';

	return html`
		<div class="wp-story-meta">
			<div class="wp-story-icon">
				<img alt="Site icon" src=${siteIconUrl} />
			</div>
			<div>
				<div class="wp-story-site-name">
					${siteName}
				</div>
				<div class="wp-story-site-description">
					${siteDescription}
				</div>
			</div>
			<${SimpleButton}
				className="wp-story-exit-fullscreen"
				label="Exit Fullscreen"
				icon="close"
				onClick=${onExitFullscreen}
			/>
		</div>
	`;
}
