import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';
import StoryPlayer from './player';

function renderPlayer( rootElement, settings ) {
	if ( typeof rootElement === 'string' ) {
		rootElement = document.querySelectorAll( rootElement );
	}

	const slidesWrapper = rootElement.querySelector( '.wp-story-wrapper' );
	const metaWrapper = rootElement.querySelector( '.wp-story-meta' );

	let slides = [];
	if ( slidesWrapper && slidesWrapper.children.length > 0 ) {
		slides = parseSlides( slidesWrapper );
	}

	let metadata = {};
	if ( metaWrapper && metaWrapper.children.length > 0 ) {
		metadata = parseMeta( metaWrapper );
	}

	const id = parseId( rootElement );

	render(
		<StoryPlayer
			id={ id }
			slides={ slides }
			metadata={ metadata }
			disabled={ false }
			{ ...settings }
		/>,
		rootElement
	);
}

function parseSlides( slidesWrapper ) {
	const mediaElements = [ ...slidesWrapper.querySelectorAll( 'li > figure > :first-child' ) ];
	return mediaElements.map( element => ( {
		alt: element.getAttribute( 'alt' ) || element.getAttribute( 'title' ),
		mime: element.getAttribute( 'data-mime' ) || element.getAttribute( 'type' ),
		url: element.getAttribute( 'src' ),
		id: element.getAttribute( 'data-id' ),
		type: element.tagName.toLowerCase() === 'img' ? 'image' : 'video',
		srcset: element.getAttribute( 'srcset' ),
		sizes: element.getAttribute( 'sizes' ),
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

function parseId( rootElement ) {
	return rootElement.getAttribute( 'data-id' );
}

if ( typeof window !== 'undefined' ) {
	const settingsFromUrl = Array.from( new URLSearchParams( window.location.search ).entries() )
		.filter( searchParam => searchParam[ 0 ].startsWith( 'wp-story-' ) )
		.reduce( ( settings, searchParam ) => {
			// convert `wp-story-load-in-fullscreen` to `loadInFullscreen`
			const settingName = searchParam[ 0 ]
				.replace( /^wp-story-/, '' )
				.replace( /-([a-z])/g, group => group[ 1 ].toUpperCase() );
			try {
				// try to cast numbers and booleans first
				settings[ settingName ] = JSON.parse( searchParam[ 1 ] );
			} catch ( err ) {
				// assume valid string
				settings[ settingName ] = JSON.parse( `"${ searchParam[ 1 ] }"` );
			}
			return settings;
		}, {} );

	domReady( function () {
		const storyBlocks = [ ...document.querySelectorAll( ':not(#debug-bar-wp-query) .wp-story' ) ];
		storyBlocks.forEach( storyBlock => {
			if ( storyBlock.getAttribute( 'data-block-initialized' ) === 'true' ) {
				return;
			}

			let settings = null;

			if ( storyBlocks.length === 1 ) {
				settings = {
					...settingsFromUrl,
				};
			}

			const settingsFromTemplate = storyBlock.getAttribute( 'data-settings' );

			if ( settingsFromTemplate ) {
				try {
					settings = {
						...settings,
						...JSON.parse( settingsFromTemplate ),
					};
				} catch ( e ) {
					// ignore parsing errors
				}
			}

			renderPlayer( storyBlock, settings );
		} );
	} );
}
