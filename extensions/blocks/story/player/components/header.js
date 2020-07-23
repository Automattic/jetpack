/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SimpleButton } from './button';

export default function Header( { fullscreen, onExitFullscreen, siteIconUrl, storyTitle } ) {
	if ( ! fullscreen ) {
		return null;
	}

	// default WP logo url relative to story/view.js
	siteIconUrl = siteIconUrl || '../../../../../../wp-includes/images/w-logo-blue.png';

	return (
		<div className="wp-story-meta">
			<div className="wp-story-icon">
				<img alt="Site icon" src={ siteIconUrl } />
			</div>
			<div>
				<div className="wp-story-title">{ storyTitle }</div>
			</div>
			<SimpleButton
				className="wp-story-exit-fullscreen"
				label="Exit Fullscreen"
				icon="close"
				onClick={ onExitFullscreen }
			/>
		</div>
	);
}
