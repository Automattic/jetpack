/**
 * External dependencies
 */
import { html } from 'htm/preact';
import { useCallback } from 'preact/hooks';

export const ProgressBar = ( {
	slides,
	settings,
	fullscreen,
	currentSlideIndex,
	currentSlideProgress,
	onSlideSeek,
} ) => {
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
				const onClick = () => {
					if ( ! fullscreen ) {
						return null;
					}
					onSlideSeek( index );
				};
				return settings.renderers.renderBullet( html, {
					index,
					progress,
					onClick,
				} );
			} )}
		</div>
	`;
};

export default ProgressBar;
