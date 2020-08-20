/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SimpleButton } from './button';
import { __ } from '@wordpress/i18n';

export default function Controls( { playing, muted, setPlaying, setMuted, showMute } ) {
	return (
		<div className="wp-story-controls">
			<SimpleButton
				label={ __( 'Play', 'jetpack' ) }
				onClick={ () => setPlaying( ! playing ) }
				icon={ playing ? 'pause' : 'play_arrow' }
			/>
			{ showMute && (
				<SimpleButton
					label={ __( 'Mute', 'jetpack' ) }
					onClick={ () => setMuted( ! muted ) }
					icon={ muted ? 'volume_off' : 'volume_up' }
				/>
			) }
		</div>
	);
}
