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
	metadata: {},
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
	volume: 0.5,
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

	let container = root.querySelector( '.wp-story-container' );
	if ( ! container ) {
		container = document.createElement( 'div' );
		container.classList.add( 'wp-story-container' );
		root.appendChild( container );
	}

	const slidesWrapper = container.querySelector( '.wp-story-wrapper' );
	const metaWrapper = container.querySelector( '.wp-story-meta' );

	playerEvents.on( 'go-fullscreen', () => {
		if ( settings.playInFullScreen ) {
			document.body.classList.add( 'wp-story-in-fullscreen' );
			document.getElementsByTagName( 'html' )[ 0 ].classList.add( 'wp-story-in-fullscreen' );
			container.classList.add( 'wp-story-fullscreen' );
			rootElement.classList.add( 'wp-story-fullscreen' );
		}
	} );

	playerEvents.on( 'exit-fullscreen', () => {
		document.body.classList.remove( 'wp-story-in-fullscreen' );
		document.getElementsByTagName( 'html' )[ 0 ].classList.remove( 'wp-story-in-fullscreen' );
		rootElement.classList.remove( 'wp-story-fullscreen' );
		container.classList.remove( 'wp-story-fullscreen' );
	} );

	const isFullscreen = () => container.classList.contains( 'wp-story-fullscreen' );

	const resize = () => {
		if ( isFullscreen() ) {
			const slidesMaxHeight = slidesWrapper.offsetHeight;
			if ( ! settings.autoResize ) {
				container.style.width = `${ settings.defaultAspectRatio * slidesMaxHeight }px`;
			} else {
				// TODO: compute from current media width/height
			}
		}
	};

	let pendingRequestAnimationFrame = null;
	new ResizeObserver( () => {
		if ( pendingRequestAnimationFrame ) {
			cancelAnimationFrame( pendingRequestAnimationFrame );
			pendingRequestAnimationFrame = null;
		}
		pendingRequestAnimationFrame = requestAnimationFrame( () => {
			resize();
		} );
	} ).observe( container );

	const initPlayer = ( newSettings = settings ) => {
		renderPlayer( root, newSettings );
	};

	if ( settings.autoload ) {
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

function parseMeta( metaWrapper ) {
	const siteIconElement = metaWrapper.querySelector( 'div:first-child > img' );
	const siteNameElement = metaWrapper.querySelector( '.wp-story-site-name' );
	const siteDescriptionElement = metaWrapper.querySelector( '.wp-story-site-description' );
	const siteIconUrl = siteIconElement && siteIconElement.src;
	const siteName = siteNameElement && siteNameElement.innerText;
	const siteDescription = siteDescriptionElement && siteDescriptionElement.innerText;

	return {
		siteDescription,
		siteIconUrl,
		siteName,
	};
}
