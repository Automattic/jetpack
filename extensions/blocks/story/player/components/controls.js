/**
 * External dependencies
 */
import { html } from 'htm/preact';

/**
 * Internal dependencies
 */
import { SimpleButton } from './button';

export default function Controls( { playing, muted, setPlaying, setMuted } ) {
	return html`
		<div class="wp-story-controls">
			<${SimpleButton}
				label="Play"
				onClick=${() => setPlaying( ! playing )}
				icon=${playing ? 'play_arrow' : 'pause'}
			/>
			<${SimpleButton}
				label="Mute"
				onClick=${() => setMuted( ! muted )}
				icon=${muted ? 'volume_up' : 'volume_off'}
			/>
		</div>
	`;
}
