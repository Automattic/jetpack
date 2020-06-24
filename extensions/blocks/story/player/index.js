/**
 * External dependencies
 */
import { merge } from 'lodash';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * Internal dependencies
 */
import './style.scss';
import { supportsShadow, toShadow } from './shadow-dom';
import { renderPlayer, playerEvents } from './player';
import defaultRenderers from './default-renderers';

const defaultSettings = {
	slides: [],
	autoload: true,
	imageTime: 5000,
	renderInterval: 50,
	startMuted: true,
	playInFullScreen: true,
	renderers: defaultRenderers,
	shadowDOM: {
		enabled: true,
		mode: 'open', // closed not supported right now
		styles: '#jetpack-block-story-css',
	},
	defaultAspectRatio: 720 / 1280,
	autoResize: false,
};

export default function player( rootElement, params ) {
	const settings = merge( {}, defaultSettings, params );
	if ( typeof rootElement === 'string' ) {
		rootElement = document.querySelectorAll( rootElement );
	}

	const root =
		supportsShadow() && settings.shadowDOM.enabled
			? toShadow( rootElement, settings.shadowDOM )
			: rootElement;

	const container = root.querySelector( '.wp-story-container' );
	const slidesWrapper = container.querySelector( '.wp-story-wrapper' );

	const fullscreen = false;

	const goFullScreen = () => {
		document.body.classList.add( 'wp-story-in-fullscreen' );
		document.getElementsByTagName( 'html' )[ 0 ].classList.add( 'wp-story-in-fullscreen' );
		container.classList.add( 'wp-story-fullscreen' );
		rootElement.classList.add( 'wp-story-fullscreen' );
	};

	const exitFullScreen = () => {
		document.body.classList.remove( 'wp-story-in-fullscreen' );
		document.getElementsByTagName( 'html' )[ 0 ].classList.remove( 'wp-story-in-fullscreen' );
		rootElement.classList.remove( 'wp-story-fullscreen' );
		container.classList.remove( 'wp-story-fullscreen' );
	};

	const resize = () => {
		if ( fullscreen ) {
			const slidesMaxHeight = slidesWrapper.offsetHeight;
			if ( ! settings.autoResize ) {
				container.style.width = `${ settings.defaultAspectRatio * slidesMaxHeight }px`;
			} else {
				// TODO: compute from current media width/height
			}
		}
	};

	playerEvents.on( 'play', () => {
		rootElement.classList.remove( 'wp-story-paused' );
		rootElement.classList.add( 'wp-story-playing' );
	} );
	playerEvents.on( 'pause', () => {
		rootElement.classList.remove( 'wp-story-playing' );
		rootElement.classList.add( 'wp-story-paused' );
	} );
	playerEvents.on( 'mute', () => {
		rootElement.classList.add( 'wp-story-muted' );
	} );
	playerEvents.on( 'unmute', () => {
		rootElement.classList.remove( 'wp-story-muted' );
	} );

	/*
	let pendingRequestAnimationFrame = null;
	new ResizeObserver( () => {
		if ( pendingRequestAnimationFrame ) {
			cancelAnimationFrame( pendingRequestAnimationFrame );
			pendingRequestAnimationFrame = null;
		}
		pendingRequestAnimationFrame = requestAnimationFrame( () => {
			resize();
		} );
	} ).observe( container );*/

	const initPlayer = slides => {
		renderPlayer( root, slides, settings );
	};

	if ( settings.autoload ) {
		let slides = settings.slides || [];
		if ( slides.length === 0 && slidesWrapper.children.length > 0 ) {
			slides = parseSlides( slidesWrapper );
		}

		initPlayer( slides );
	}

	return {
		load: initPlayer,
		on: playerEvents.on.bind( playerEvents ),
	};
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
