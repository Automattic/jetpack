/**
 * External dependencies
 */
import { html } from 'htm/preact';

export const ProgressBar = ( {
	slides,
	settings,
	fullscreen,
	currentSlideIndex,
	currentSlideProgress,
	onSlideSeek,
} ) => {
	if ( settings.playInFullScreen && ! fullscreen ) {
		return null;
	}

	return html`
		<div class="wp-story-pagination wp-story-pagination-bullets">
			${slides.map( ( slide, index ) => {
				let progress;
				if ( index < currentSlideIndex ) {
					progress = 100;
				} else if ( index > currentSlideIndex ) {
					progress = 0;
				} else {
					progress = currentSlideProgress;
				}
				return settings.renderers.renderBullet( html, {
					index,
					progress,
					onClick: () => onSlideSeek( index ),
				} );
			} )}
		</div>
	`;
};

export default ProgressBar;
