/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SimpleButton } from './button';
import { __ } from '@wordpress/i18n';
import { PauseIcon, PlayIcon, VolumeOffIcon, VolumeUpIcon } from './icons';

export default function Controls( { playing, muted, setPlaying, setMuted, showMute } ) {
	return (
		<div className="wp-story-controls">
			<SimpleButton label={ __( 'Play', 'jetpack' ) } onClick={ () => setPlaying( ! playing ) }>
				{ playing ? <PauseIcon /> : <PlayIcon /> }
			</SimpleButton>
			{ showMute && (
				<SimpleButton label={ __( 'Mute', 'jetpack' ) } onClick={ () => setMuted( ! muted ) }>
					{ muted ? <VolumeOffIcon /> : <VolumeUpIcon /> }
				</SimpleButton>
			) }
		</div>
	);
}
