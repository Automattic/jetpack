/**
 * External dependencies
 */
import classNames from 'classnames';
import { html } from 'htm/preact';
import { useCallback } from 'preact/hooks';

/**
 * Internal dependencies
 */
import { DecoratedButton } from './button';

export default function Overlay( {
	playing,
	ended,
	onClick,
	onNextSlide,
	onPreviousSlide,
	tapToPlayPause,
} ) {
	const onOverlayPressed = useCallback( () => {
		tapToPlayPause && onClick();
	}, [ tapToPlayPause, onClick ] );

	const onPlayPressed = useCallback( () => {
		! tapToPlayPause && onClick();
	}, [ tapToPlayPause, onClick ] );

	return html`
		<div
			class=${classNames( {
				'wp-story-overlay': true,
				'wp-story-clickable': tapToPlayPause,
			} )}
			onClick=${onOverlayPressed}
		>
			${! playing &&
				! ended &&
				html`
					<${DecoratedButton}
						size=${80}
						iconSize=${56}
						label="Play Story"
						icon="play_arrow"
						onClick=${onPlayPressed}
					/>
				`}
			${ended &&
				html`
					<${DecoratedButton}
						size=${80}
						iconSize=${56}
						label="Replay Story"
						icon="replay"
						onClick=${onPlayPressed}
					/>
				`}
			<div class="wp-story-prev-slide" onClick=${onPreviousSlide}>
				<${DecoratedButton}
					size=${44}
					iconSize=${24}
					label="Previous Slide"
					icon="navigate_before"
					className="outlined-w"
				/>
			</div>
			<div class="wp-story-next-slide" onClick=${onNextSlide}>
				<${DecoratedButton}
					size=${44}
					iconSize=${24}
					label="Next Slide"
					icon="navigate_next"
					className="outlined-w"
				/>
			</div>
		</div>
	`;
}
