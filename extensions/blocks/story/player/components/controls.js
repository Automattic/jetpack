/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SimpleButton } from './button';

export default function Controls( { playing, muted, setPlaying, setMuted } ) {
	return (
		<div className="wp-story-controls">
			<SimpleButton
				label="Play"
				onClick={ () => setPlaying( ! playing ) }
				icon={ playing ? 'pause' : 'play_arrow' }
			/>
			<SimpleButton
				label="Mute"
				onClick={ () => setMuted( ! muted ) }
				icon={ muted ? 'volume_off' : 'volume_up' }
			/>
		</div>
	);
}
