/**
 * External dependencies
 */
import { merge } from 'lodash';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo, useLayoutEffect, useRef, useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import './store';
import { Player } from './player';
import ShadowRoot from './lib/shadow-root';
import * as fullscreenAPI from './lib/fullscreen-api';
import Modal from './modal';
import { __ } from '@wordpress/i18n';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	window.navigator.userAgent
);

const defaultSettings = {
	imageTime: 5, // in sec
	startMuted: false,
	playInFullscreen: true,
	playOnNextSlide: true,
	playOnLoad: false,
	exitFullscreenOnEnd: true,
	loadInFullscreen: false,
	blurredBackground: true,
	showSlideCount: false,
	showProgressBar: true,
	shadowDOM: {
		enabled: true,
		mode: 'open', // closed not supported right now
		globalStyleElements:
			'#jetpack-block-story-css, link[href*="jetpack/_inc/blocks/story/view.css"]',
	},
	defaultAspectRatio: 720 / 1280,
	cropUpTo: 0.2, // crop percentage allowed, after which media is displayed in letterbox
	volume: 0.5,
	maxBullets: 7,
	maxBulletsFullscreen: 14,
};

export default function StoryPlayer( { id, slides, metadata, disabled, ...settings } ) {
	const playerSettings = merge( {}, defaultSettings, settings );

	const rootElementRef = useRef();
	const playerId = useMemo( () => id || Math.random().toString( 36 ), [ id ] );
	const [ fullscreen, setFullscreen ] = useState( false );
	const [ lastScrollPosition, setLastScrollPosition ] = useState( null );

	const { init } = useDispatch( 'jetpack/story/player' );
	const shouldUseFullscreenAPI = isMobile && fullscreenAPI.enabled();

	useEffect( () => {
		// Make sure the store is initialized for this player instance
		init( playerId );

		if ( settings.loadInFullscreen ) {
			setFullscreen( true );
		}
	}, [] );

	useLayoutEffect( () => {
		if ( shouldUseFullscreenAPI ) {
			if ( fullscreen ) {
				fullscreenAPI.launch( rootElementRef.current );
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

	const player = (
		<div
			ref={ rootElementRef }
			className={ classNames( [ 'wp-story-app', { 'wp-story-fullscreen': fullscreen } ] ) }
		>
			<Player
				id={ playerId }
				fullscreen={ fullscreen }
				setFullscreen={ setFullscreen }
				slides={ slides }
				metadata={ metadata }
				disabled={ disabled }
				{ ...playerSettings }
			/>
		</div>
	);

	return (
		<>
			<ShadowRoot { ...playerSettings.shadowDOM }>
				{ ! fullscreen && player }
			</ShadowRoot>
			<Modal
				contentLabel={ __( 'Story' ) }
				isOpened={ fullscreen && ! shouldUseFullscreenAPI }
				aria={ { describedby: 'hello', labelledby: 'hello world' } }
				onRequestClose={ () => setFullscreen( false ) }
				shadowDOM={ playerSettings.shadowDOM }
			>
				{ fullscreen && player }
			</Modal>
		</>
	);
}
