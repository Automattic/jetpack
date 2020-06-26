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
	const onOverlayClick = useCallback( () => {
		tapToPlayPause && onClick();
	}, [ tapToPlayPause, onClick ] );
	return html`
		<div
			class=${classNames( {
				'wp-story-overlay': true,
				'wp-story-clickable': tapToPlayPause,
			} )}
			onClick=${onOverlayClick}
		>
			${! playing &&
				! ended &&
				html`
					<${DecoratedButton}
						size=${80}
						iconSize=${56}
						label="Play Story"
						icon="play_arrow"
						onClick=${onClick}
					/>
				`}
			${ended &&
				html`
					<${DecoratedButton}
						size=${80}
						iconSize=${56}
						label="Replay Story"
						icon="replay"
						onClick=${onClick}
					/>
				`}
			<div class="wp-story-prev-slide">
				<${DecoratedButton}
					size=${44}
					iconSize=${24}
					label="Previous Slide"
					icon="navigate_before"
					className="outlined-w"
					onClick=${onPreviousSlide}
				/>
			</div>
			<div class="wp-story-next-slide">
				<${DecoratedButton}
					size=${44}
					iconSize=${24}
					label="Next Slide"
					icon="navigate_next"
					className="outlined-w"
					onClick=${onNextSlide}
				/>
			</div>
		</div>
	`;
}
