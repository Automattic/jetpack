import { __ } from '@wordpress/i18n';
import { SimpleButton } from './button';
import { CloseIcon } from './icons';

export default function Header( { fullscreen, onExitFullscreen, siteIconUrl, storyTitle } ) {
	if ( ! fullscreen ) {
		return null;
	}

	return (
		<div className="wp-story-meta">
			<div className="wp-story-icon">
				<img alt={ __( 'Site icon', 'jetpack' ) } src={ siteIconUrl } width="40" height="40" />
			</div>
			<div>
				<div className="wp-story-title">{ storyTitle }</div>
			</div>
			<SimpleButton
				className="wp-story-exit-fullscreen"
				label={ __( 'Exit Fullscreen', 'jetpack' ) }
				onClick={ onExitFullscreen }
			>
				<CloseIcon />
			</SimpleButton>
		</div>
	);
}
