import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useEffect, useCallback } from '@wordpress/element';
import { ENTER, SPACE, LEFT, RIGHT } from '@wordpress/keycodes';
import ExpandableSandbox from './expandable-sandbox';
import PlayerUI from './player-ui';

import './style.scss';
import './store';

export default function StoryPlayer( { id, slides, metadata, disabled, ...settings } ) {
	const playerId = useMemo( () => id || Math.random().toString( 36 ), [ id ] );
	const { init, setEnded, setPlaying, setFullscreen, showSlide } = useDispatch(
		'jetpack/story/player'
	);
	const { playing, currentSlideIndex, fullscreen, isReady, playerSettings } = useSelect(
		select => {
			const { getCurrentSlideIndex, getSettings, isFullscreen, isPlayerReady, isPlaying } = select(
				'jetpack/story/player'
			);
			if ( ! isPlayerReady( playerId ) ) {
				return {
					isReady: false,
				};
			}

			return {
				playing: isPlaying( playerId ),
				currentSlideIndex: getCurrentSlideIndex( playerId ),
				isReady: true,
				fullscreen: isFullscreen( playerId ),
				playerSettings: getSettings( playerId ),
			};
		},
		[ playerId ]
	);

	useEffect( () => {
		if ( ! isReady ) {
			init( playerId, {
				slideCount: slides.length,
				...settings,
			} );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isReady, playerId ] );

	const onKeyDown = useCallback(
		event => {
			switch ( event.keyCode ) {
				case ENTER:
					if ( fullscreen ) {
						break;
					}
				case SPACE:
					setPlaying( playerId, ! playing );
					break;
				case LEFT:
					if ( currentSlideIndex > 0 ) {
						showSlide( playerId, currentSlideIndex - 1 );
					}
					break;
				case RIGHT:
					if ( currentSlideIndex < slides.length - 1 ) {
						showSlide( playerId, currentSlideIndex + 1 );
					} else {
						setEnded( playerId );
					}
					break;
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ playerId, currentSlideIndex, fullscreen, playing ]
	);

	const exitFullscreen = useCallback( () => {
		setFullscreen( playerId, false );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ playerId ] );

	if ( ! isReady ) {
		return null;
	}

	return (
		<ExpandableSandbox
			shadowDOM={ playerSettings.shadowDOM }
			className="wp-story-app"
			fullscreenClassName="wp-story-fullscreen"
			bodyFullscreenClassName="wp-story-in-fullscreen"
			playerQuerySelector=".wp-story-container"
			fullscreen={ fullscreen }
			onExitFullscreen={ exitFullscreen }
			onKeyDown={ onKeyDown }
		>
			<PlayerUI id={ playerId } slides={ slides } metadata={ metadata } disabled={ disabled } />
		</ExpandableSandbox>
	);
}
