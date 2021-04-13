/**
 * WordPress dependencies
 */
import { useMemo, useEffect, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { ESCAPE, SPACE, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import './style.scss';
import './store';
import { Player } from './player';
import ShadowPlayer from './shadow-player';

export default function StoryPlayer( { id, slides, metadata, disabled, ...settings } ) {
	const playerId = useMemo( () => id || Math.random().toString( 36 ), [ id ] );
	const { init, setEnded, setPlaying, setFullscreen, showSlide } = useDispatch(
		'jetpack/story/player'
	);
	const { playing, currentSlideIndex, fullscreen, isPlayerReady, playerSettings } = useSelect(
		select => {
			const { getCurrentSlideIndex, getSettings, isFullscreen, isPlayerReady, isPlaying } = select(
				'jetpack/story/player'
			);
			const isReady = isPlayerReady( playerId );
			if ( ! isReady ) {
				return {
					isPlayerReady: false,
				};
			}

			return {
				playing: isPlaying( playerId ),
				currentSlideIndex: getCurrentSlideIndex( playerId ),
				isPlayerReady: true,
				fullscreen: isFullscreen( playerId ),
				playerSettings: getSettings( playerId ),
			};
		},
		[ playerId ]
	);

	useEffect( () => {
		if ( ! isPlayerReady ) {
			init( playerId, {
				slideCount: slides.length,
				...settings,
			} );
		}
	}, [ playerId ] );

	const onKeyDown = useCallback(
		event => {
			switch ( event.keyCode ) {
				case SPACE:
					event.preventDefault();
					setPlaying( playerId, ! playing );
					break;
				case LEFT:
					event.preventDefault();
					if ( currentSlideIndex > 0 ) {
						showSlide( playerId, currentSlideIndex - 1 );
					}
					break;
				case RIGHT:
					event.preventDefault();
					if ( currentSlideIndex < slides.length - 1 ) {
						showSlide( playerId, currentSlideIndex + 1 );
					} else {
						setEnded( playerId );
					}
					break;
			}
		},
		[ playerId, currentSlideIndex, fullscreen, playing ]
	);

	const exitFullscreen = useCallback( () => {
		setFullscreen( playerId, false );
	}, [ playerId ] );

	if ( ! isPlayerReady ) {
		return null;
	}

	return (
		<ShadowPlayer
			shadowDOM={ playerSettings.shadowDOM }
			className="wp-story-app"
			fullscreenClassName="wp-story-fullscreen"
			bodyFullscreenClassName="wp-story-in-fullscreen"
			fullscreen={ fullscreen }
			onExitFullscreen={ exitFullscreen }
			onKeyDown={ onKeyDown }
		>
			<Player id={ playerId } slides={ slides } metadata={ metadata } disabled={ disabled } />
		</ShadowPlayer>
	);
}
