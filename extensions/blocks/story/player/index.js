/**
 * External dependencies
 */
import { merge } from 'lodash';
import retargetEvents from 'react-shadow-dom-retarget-events';

/**
 * Internal dependencies
 */
import './style.scss';
import { supportsShadow, toShadow } from './shadow-dom';
import { renderPlayer } from './player';
import { fullscreen } from './utils';

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

	const useShadowDom = supportsShadow() && settings.shadowDOM.enabled;

	const root = useShadowDom ? toShadow( rootElement, settings.shadowDOM ) : rootElement;

	let appMountElement = root.querySelector( 'div' );
	if ( ! appMountElement ) {
		appMountElement = document.createElement( 'div' );
		appMountElement.className = '';
		appMountElement.style.display = 'contents';
		root.appendChild( appMountElement );
	}

	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);

	const registerListeners = playerEvents => {
		let lastScrollPosition = null;
		playerEvents.on( 'go-fullscreen', () => {
			if ( settings.playInFullscreen ) {
				rootElement.classList.add( 'wp-story-fullscreen' );
				if ( isMobile && fullscreen.enabled() && ! settings.loadInFullscreen ) {
					fullscreen.launch( rootElement );
				} else {
					// position: fixed does not work as expected on mobile safari
					// To fix that we need to add a fixed positioning to body,
					// retain the current scroll position and restore it when we exit fullscreen
					lastScrollPosition = [
						document.documentElement.scrollLeft,
						document.documentElement.scrollTop,
					];
					document.body.classList.add( 'wp-story-in-fullscreen' );
					document.getElementsByTagName( 'html' )[ 0 ].classList.add( 'wp-story-in-fullscreen' );
				}
			}
		} );

		playerEvents.on( 'exit-fullscreen', async () => {
			if ( fullscreen.element() ) {
				await fullscreen.exit();
			} else {
				document.body.classList.remove( 'wp-story-in-fullscreen' );
				if ( lastScrollPosition ) {
					window.scrollTo( ...lastScrollPosition );
				}
				document.getElementsByTagName( 'html' )[ 0 ].classList.remove( 'wp-story-in-fullscreen' );
			}
			rootElement.classList.remove( 'wp-story-fullscreen' );
		} );
	};

	let playerEvents = null;
	const initPlayer = ( newSettings = settings ) => {
		if ( playerEvents ) {
			playerEvents.removeAllListeners( 'exit-fullscreen' );
			playerEvents.removeAllListeners( 'go-fullscreen' );
		}
		playerEvents = renderPlayer( appMountElement, newSettings );
		registerListeners( playerEvents );
		if ( useShadowDom ) {
			retargetEvents( root );
		}
	};

	if ( settings.autoload ) {
		const slidesWrapper = root.querySelector( '.wp-story-wrapper' );
		const metaWrapper = root.querySelector( '.wp-story-meta' );

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
