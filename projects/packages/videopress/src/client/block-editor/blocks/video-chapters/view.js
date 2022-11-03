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
	const videoPlayerWrapper = document.querySelector( '.jetpack-videopress-player__wrapper' );
	const videoIframe = videoPlayerWrapper.querySelector( 'iframe' );

	window.iframeApi = window.VideoPressIframeApi( videoIframe, () => {
		iframeApi.info.onInfoUpdated( async () => {
			const guid = await iframeApi.info.guid();
			const title = await iframeApi.info.title();
			const duration = await iframeApi.info.duration();
			const poster = await iframeApi.info.poster();
			const privacy = await iframeApi.info.privacy();
		} );
	} );

	// Chapters list
	const listWrapperElement = document.querySelectorAll( '.video-chapters_list' );
	const guid = listWrapperElement[ 0 ].dataset.guid;

	const listElements = document.querySelectorAll( '.video-chapters_list ul li' );

	listElements.forEach( itemElement => {
		itemElement.addEventListener( 'click', event => {
			event.preventDefault();
			iframeApi.controls.seek( 1000 );
			iframeApi.controls.play();
		} );
	} );
} );
