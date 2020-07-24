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
import ReactShadowRoot from './lib/react-shadow-root';
import * as fullscreenAPI from './lib/fullscreen-api';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	window.navigator.userAgent
);

const defaultSettings = {
	slides: [],
	metadata: {},
	autoload: true,
	disabled: false,
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
		styles: '#jetpack-block-story-css',
	},
	defaultAspectRatio: 720 / 1280,
	volume: 0.5,
};

export default function player( rootElement, params ) {
	const settings = merge( {}, defaultSettings, params );
	if ( typeof rootElement === 'string' ) {
		rootElement = document.querySelectorAll( rootElement );
	}

	const initPlayer = ( newSettings = settings ) => {
		render( <App { ...newSettings } />, rootElement );
	};

	if ( settings.autoload ) {
		const slidesWrapper = rootElement.querySelector( '.wp-story-wrapper' );
		const metaWrapper = rootElement.querySelector( '.wp-story-meta' );

		settings.slides = settings.slides || [];
		if ( settings.slides.length === 0 && slidesWrapper && slidesWrapper.children.length > 0 ) {
			settings.slides = parseSlides( slidesWrapper );
		}

		settings.metadata = settings.metadata || {};
		if (
			Object.keys( settings.metadata ).length === 0 &&
			metaWrapper &&
			metaWrapper.children.length > 0
		) {
			settings.metadata = parseMeta( metaWrapper );
		}

		initPlayer( settings );
	}

	return initPlayer;
}

function parseSlides( slidesWrapper ) {
	const mediaElements = [ ...slidesWrapper.querySelectorAll( 'li > figure > :first-child' ) ];
	return mediaElements.map( element => ( {
		alt: element.getAttribute( 'alt' ) || element.getAttribute( 'title' ),
		mime: element.getAttribute( 'data-mime' ) || element.getAttribute( 'type' ),
		url: element.getAttribute( 'src' ),
		id: element.getAttribute( 'data-id' ),
		type: element.tagName.toLowerCase() === 'img' ? 'image' : 'video',
	} ) );
}

function parseMeta( metaWrapper ) {
	const siteIconElement = metaWrapper.querySelector( 'div:first-child > img' );
	const storyTitleElement = metaWrapper.querySelector( '.wp-story-title' );
	const siteIconUrl = siteIconElement && siteIconElement.src;
	const storyTitle = storyTitleElement && storyTitleElement.innerText;

	return {
		storyTitle,
		siteIconUrl,
	};
}

function Styles( { globalStyleElements } ) {
	const styleElements =
		typeof globalStyleElements === 'string'
			? [ ...document.querySelectorAll( globalStyleElements ) ]
			: globalStyleElements;

	return (
		<>
			{ styleElements.map( ( { id, tagName, attributes, innerHTML }, index ) => {
				if ( tagName === 'LINK' ) {
					return (
						<link
							key={ id || index }
							id={ id }
							rel={ attributes.rel.value }
							href={ attributes.href.value }
						/>
					);
				} else if ( tagName === 'STYLE' ) {
					return (
						<style key={ id || index } id={ id }>
							{ innerHTML }
						</style>
					);
				}
			} ) }
		</>
	);
}

function App( props ) {
	const rootElementRef = useRef();
	const [ fullscreen, setFullscreen ] = useState( false );
	const [ lastScrollPosition, setLastScrollPosition ] = useState( null );

	useEffect( () => {
		if ( fullscreen ) {
			if ( isMobile && fullscreenAPI.enabled() && ! props.loadInFullscreen ) {
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
		<div
			className={ classNames( [ 'wp-story-app', { 'wp-story-fullscreen': fullscreen } ] ) }
			ref={ rootElementRef }
		>
			<ReactShadowRoot>
				<Styles globalStyleElements={ props.shadowDOM.styles } />
				<Player fullscreen={ fullscreen } setFullscreen={ setFullscreen } { ...props } />
			</ReactShadowRoot>
		</div>
	);
}
