/**
 * External dependencies
 */
import { merge } from 'lodash';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement, render, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { Player } from './player';
import ShadowRoot from './lib/shadow-root';
import * as fullscreenAPI from './lib/fullscreen-api';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	window.navigator.userAgent
);

const defaultSettings = {
	imageTime: 5000,
	renderInterval: 50,
	startMuted: false,
	playInFullscreen: true,
	exitFullscreenOnEnd: true,
	loadInFullscreen: false,
	tapToPlayPause: true, // embed feature
	blurredBackground: true,
	shadowDOM: {
		enabled: true,
		mode: 'open', // closed not supported right now
		globalStyleElements:
			'#jetpack-block-story-css, link[href*="jetpack/_inc/blocks/story/view.css"]',
	},
	defaultAspectRatio: 720 / 1280,
	volume: 0.5,
};

export default function StoryPlayer( { slides, metadata, disabled, settings } ) {
	const playerSettings = merge( {}, defaultSettings, settings );

	const rootElementRef = useRef();
	const [ fullscreen, setFullscreen ] = useState( false );
	const [ lastScrollPosition, setLastScrollPosition ] = useState( null );

	useEffect( () => {
		if ( fullscreen ) {
			if ( isMobile && fullscreenAPI.enabled() && ! playerSettings.loadInFullscreen ) {
				fullscreenAPI.launch( rootElementRef.current );
			} else {
				// position: fixed does not work as expected on mobile safari
				// To fix that we need to add a fixed positioning to body,
				// retain the current scroll position and restore it when we exit fullscreen
				setLastScrollPosition( [
					document.documentElement.scrollLeft,
					document.documentElement.scrollTop,
				] );
				document.body.classList.add( 'wp-story-in-fullscreen' );
				document.getElementsByTagName( 'html' )[ 0 ].classList.add( 'wp-story-in-fullscreen' );
			}
		} else {
			// eslint-disable-next-line no-lonely-if
			if ( fullscreenAPI.element() ) {
				fullscreenAPI.exit();
			} else {
				document.body.classList.remove( 'wp-story-in-fullscreen' );
				if ( lastScrollPosition ) {
					window.scrollTo( ...lastScrollPosition );
				}
				document.getElementsByTagName( 'html' )[ 0 ].classList.remove( 'wp-story-in-fullscreen' );
			}
		}
	}, [ fullscreen ] );

	return (
		<ShadowRoot { ...playerSettings.shadowDOM }>
			<div
				className={ classNames( [ 'wp-story-app', { 'wp-story-fullscreen': fullscreen } ] ) }
				ref={ rootElementRef }
			>
				<Player
					fullscreen={ fullscreen }
					setFullscreen={ setFullscreen }
					slides={ slides }
					metadata={ metadata }
					disabled={ disabled }
					{ ...playerSettings }
				/>
			</div>
		</ShadowRoot>
	);
}
