/**
 * External dependencies
 */
import { html } from 'htm/preact';

export default function Bullet( { index, progress, onClick } ) {
	return html`
		<button
			class="wp-story-pagination-bullet"
			role="button"
			aria-label="Go to slide ${index}"
			onClick=${onClick}
		>
			<div class="wp-story-pagination-bullet-bar">
				<div
					class="wp-story-pagination-bullet-bar-progress"
					style="${{ width: `${ progress }%` }}"
				></div>
			</div>
		</button>
	`;
}
