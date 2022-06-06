import { _x } from '@wordpress/i18n';
import { SimpleButton } from './button';
import { PauseIcon, PlayIcon, VolumeOffIcon, VolumeUpIcon } from './icons';

export default function Controls( { playing, muted, onPlayPressed, onMutePressed, showMute } ) {
	return (
		<div className="wp-story-controls">
			<SimpleButton
				isPressed={ playing }
				label={
					playing
						? _x( 'pause', 'Button tooltip text', 'jetpack' )
						: _x(
								'play',
								'Button tooltip text',
								'jetpack',
								/* dummy arg to avoid bad minification */ 0
						  )
				}
				onClick={ onPlayPressed }
			>
				{ playing ? <PauseIcon /> : <PlayIcon /> }
			</SimpleButton>
			{ showMute && (
				<SimpleButton
					isPressed={ muted }
					label={
						muted
							? _x( 'unmute', 'Button tooltip text', 'jetpack' )
							: _x(
									'mute',
									'Button tooltip text',
									'jetpack',
									/* dummy arg to avoid bad minification */ 0
							  )
					}
					onClick={ onMutePressed }
				>
					{ muted ? <VolumeOffIcon /> : <VolumeUpIcon /> }
				</SimpleButton>
			) }
		</div>
	);
}
