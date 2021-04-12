/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useMemo,
	useLayoutEffect,
	useRef,
	useState,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import './store';
import { Player } from './player';
import ShadowRoot from './lib/shadow-root';
import * as fullscreenAPI from './lib/fullscreen-api';
import Modal from './modal';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	window.navigator.userAgent
);

export default function StoryPlayer( { id, slides, metadata, disabled, ...settings } ) {
	const rootElementRef = useRef();
	const playerId = useMemo( () => id || Math.random().toString( 36 ), [ id ] );
	const [ lastScrollPosition, setLastScrollPosition ] = useState( null );

	const { init, setFullscreen } = useDispatch( 'jetpack/story/player' );
	const { fullscreen, isPlayerReady, playerSettings } = useSelect(
		select => {
			const { getSettings, isFullscreen, isPlayerReady } = select( 'jetpack/story/player' );
			const isReady = isPlayerReady( playerId );
			if ( ! isReady ) {
				return {
					isPlayerReady: false,
				};
			}

			return {
				isPlayerReady: true,
				fullscreen: isFullscreen( playerId ),
				playerSettings: getSettings( playerId ),
			};
		},
		[ playerId ]
	);

	//const shouldUseFullscreenAPI = fullscreenAPI.enabled();
	const shouldUseFullscreenAPI = isMobile && fullscreenAPI.enabled();
	const isFullPageModalOpened = fullscreen && ! shouldUseFullscreenAPI;

	useEffect( () => {
		if ( ! isPlayerReady ) {
			init( playerId, {
				slideCount: slides.length,
				...settings,
			} );
		}
	}, [ playerId ] );

	const onExitFullscreen = useCallback( () => {
		setFullscreen( playerId, false );
	}, [] );

	useLayoutEffect( () => {
		if ( shouldUseFullscreenAPI ) {
			if ( fullscreen ) {
				if ( rootElementRef.current ) {
					fullscreenAPI.launch( rootElementRef.current, onExitFullscreen );
				}
			} else if ( fullscreenAPI.element() ) {
				fullscreenAPI.exit();
			}
			return;
		}
		if ( fullscreen ) {
			// position: fixed does not work as expected on mobile safari
			// To fix that we need to add a fixed positioning to body,
			// retain the current scroll position and restore it when we exit fullscreen
			setLastScrollPosition( [
				document.documentElement.scrollLeft,
				document.documentElement.scrollTop,
			] );
			document.body.classList.add( 'wp-story-in-fullscreen' );
			document.getElementsByTagName( 'html' )[ 0 ].classList.add( 'wp-story-in-fullscreen' );
		} else {
			document.body.classList.remove( 'wp-story-in-fullscreen' );
			document.getElementsByTagName( 'html' )[ 0 ].classList.remove( 'wp-story-in-fullscreen' );
			if ( lastScrollPosition ) {
				window.scrollTo( ...lastScrollPosition );
			}
		}
	}, [ fullscreen ] );

	if ( ! isPlayerReady ) {
		return null;
	}

	const player = (
		<Player id={ playerId } slides={ slides } metadata={ metadata } disabled={ disabled } />
	);

	return (
		<>
			<ShadowRoot { ...playerSettings.shadowDOM }>
				<div
					ref={ rootElementRef }
					className={ classNames( [
						'wp-story-app',
						{ 'wp-story-fullscreen': fullscreen && shouldUseFullscreenAPI },
					] ) }
				>
					{ ! isFullPageModalOpened && player }
				</div>
			</ShadowRoot>
			<Modal
				contentLabel={ __( 'Story' ) }
				isOpened={ isFullPageModalOpened }
				aria={ {
					describedby: metadata.storyTitle || __( 'Story' ),
					labelledby: 'Story fullscreen',
				} }
				onRequestClose={ onExitFullscreen }
				shadowDOM={ playerSettings.shadowDOM }
			>
				{ isFullPageModalOpened && (
					<div
						className={ classNames( [
							'wp-story-app',
							{ 'wp-story-fullscreen': isFullPageModalOpened },
						] ) }
					>
						{ player }
					</div>
				) }
			</Modal>
		</>
	);
}
