/**
 * External dependencies
 */
import { html } from 'htm/preact';

/**
 * Internal dependencies
 */
import { DecoratedButton } from './button';

export default function Overlay( { playing, onClick } ) {
	return html`
		<div class="wp-story-overlay" onClick=${onClick}>
			${! playing &&
				html`
					<${DecoratedButton} label="Play Story" icon="play_arrow" />
				`}
		</div>
	`;
}
