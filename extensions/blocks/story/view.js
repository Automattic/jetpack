/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
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

	render(
		<StoryPlayer
			slides={ slides }
			metadata={ metadata }
			disabled={ false }
			settings={ settings }
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

if ( typeof window !== 'undefined' ) {
	domReady( function () {
		const storyBlocks = [ ...document.getElementsByClassName( 'wp-story' ) ];
		storyBlocks.forEach( storyBlock => {
			if ( storyBlock.getAttribute( 'data-block-initialized' ) === 'true' ) {
				return;
			}

			const settingsFromTemplate = storyBlock.getAttribute( 'data-settings' );
			let settings;
			if ( settingsFromTemplate ) {
				try {
					settings = JSON.parse( settingsFromTemplate );
				} catch ( e ) {
					// ignore parsing errors
				}
			}

			renderPlayer( storyBlock, settings );
		} );
	} );
}
