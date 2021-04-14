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

export default function Controls( { playing, muted, onPlayPressed, onMutePressed, showMute } ) {
	return (
		<div className="wp-story-controls">
			<SimpleButton
				isPressed={ playing }
				label={ playing ? __( 'pause', 'jetpack' ) : __( 'play', 'jetpack' ) }
				onClick={ onPlayPressed }
			>
				{ playing ? <PauseIcon /> : <PlayIcon /> }
			</SimpleButton>
			{ showMute && (
				<SimpleButton
					isPressed={ muted }
					label={ muted ? __( 'unmute', 'jetpack' ) : __( 'mute', 'jetpack' ) }
					onClick={ onMutePressed }
				>
					{ muted ? <VolumeOffIcon /> : <VolumeUpIcon /> }
				</SimpleButton>
			) }
		</div>
	);
}
