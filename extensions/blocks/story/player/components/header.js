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
	onExitFullscreenPressed,
	siteDescription,
	siteIconUrl,
	siteName,
} ) {
	if ( ! fullscreen ) {
		return null;
	}

	return html`
		<div class="wp-story-meta">
			<div>
				<img alt="Site icon" src=${siteIconUrl} width="32" height="32" />
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
				close="close"
				onclick=${onExitFullscreenPressed}
			/>
		</div>
	`;
}
