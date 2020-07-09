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
	disabled,
	onClick,
	hasPrevious,
	hasNext,
	onNextSlide,
	onPreviousSlide,
	tapToPlayPause,
} ) {
	const onOverlayPressed = useCallback( () => {
		! disabled && tapToPlayPause && onClick();
	}, [ tapToPlayPause, onClick ] );

	const onPlayPressed = useCallback(
		event => {
			if ( tapToPlayPause || disabled ) {
				// let the event bubble
				return;
			}
			event.stopPropagation();
			onClick();
		},
		[ tapToPlayPause, onClick ]
	);

	const onPreviousSlideHandler = useCallback(
		event => {
			event.stopPropagation();
			onPreviousSlide();
		},
		[ onPreviousSlide ]
	);

	const onNextSlideHandler = useCallback(
		event => {
			event.stopPropagation();
			onNextSlide();
		},
		[ onNextSlide ]
	);

	return html`
		<div
			class=${classNames( {
				'wp-story-overlay': true,
				'wp-story-clickable': tapToPlayPause,
			} )}
			onClick=${onOverlayPressed}
		>
			<div class="wp-story-prev-slide" onClick=${onPreviousSlideHandler}>
				${hasPrevious &&
					html`
						<${DecoratedButton}
							size=${44}
							iconSize=${24}
							label="Previous Slide"
							icon="navigate_before"
							className="outlined-w"
						/>
					`}
			</div>
			<div class="wp-story-next-slide" onClick=${onNextSlideHandler}>
				${hasNext &&
					html`
						<${DecoratedButton}
							size=${44}
							iconSize=${24}
							label="Next Slide"
							icon="navigate_next"
							className="outlined-w"
						/>
					`}
			</div>
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
		</div>
	`;
}
