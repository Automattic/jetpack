/**
 * External dependencies
 */
import { html } from 'htm/preact';

/**
 * Internal dependencies
 */
import { DecoratedButton } from './button';

export default function Overlay( { playing, ended, onClick, onNextSlide, onPreviousSlide } ) {
	return html`
		<div class="wp-story-overlay" onClick=${onClick}>
			${! playing &&
				! ended &&
				html`
					<${DecoratedButton} size=${80} iconSize=${56} label="Play Story" icon="play_arrow" />
				`}
			${ended &&
				html`
					<${DecoratedButton} size=${80} iconSize=${56} label="Replay Story" icon="replay" />
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
