/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

domReady( function () {
	// eslint-disable-next-line no-console
	console.log( __( 'VideoPress Chapters init', 'jetpack-videopress-pkg' ) );

	// Chapters list
	const listWrapperElement = document.querySelectorAll( '.video-chapters_list' );
	console.log( 'listWrapperElement: ', listWrapperElement );
	const guid = listWrapperElement[ 0 ].dataset.guid;
	console.log( 'guid: ', guid );

	const listElements = document.querySelectorAll( '.video-chapters_list ul li' );
	console.log( 'listElements: ', listElements );

	listElements.forEach( ( element ) => {
		element.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			const time = element.dataset.time;
			console.log( 'time: ', time );

			// const videoElement = document.getElementById( 'video-' + guid );
			// videoElement.currentTime = time;
		} );
	} );
} );
