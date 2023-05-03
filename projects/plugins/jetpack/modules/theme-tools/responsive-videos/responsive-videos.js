( function () {
	'use strict';

	var resizeTimer;

	function responsiveVideos() {
		document.querySelectorAll( '.jetpack-video-wrapper' ).forEach( function ( wrapper ) {
			wrapper.querySelectorAll( 'embed, iframe, object' ).forEach( function ( video ) {
				var videoMargin = 0;

				var previousSibling = wrapper.previousElementSibling;
				if (
					previousSibling &&
					previousSibling.nodeName === 'P' &&
					getComputedStyle( previousSibling )[ 'text-align' ] === 'center'
				) {
					videoMargin = '0 auto';
				}

				if ( ! video.hasAttribute( 'data-ratio' ) ) {
					video.setAttribute( 'data-ratio', ( video.height || 0 ) / ( video.width || 0 ) );
					video.setAttribute( 'data-width', video.width );
					video.setAttribute( 'data-height', video.height );
					video.style.display = 'block';
					video.style.margin = videoMargin;
				}

				var videoWidth = video.getAttribute( 'data-width' );
				var videoHeight = video.getAttribute( 'data-height' );
				var videoRatio = video.getAttribute( 'data-ratio' );
				var containerWidth = video.parentElement.clientWidth;

				video.removeAttribute( 'height' );
				video.removeAttribute( 'width' );

				if ( videoRatio === 'Infinity' ) {
					video.style.width = '100%';
					video.style.height = videoHeight + 'px';
					return;
				}

				if ( parseInt( videoWidth, 10 ) > containerWidth ) {
					video.style.width = containerWidth + 'px';
					video.style.height = containerWidth * parseFloat( videoRatio ) + 'px';
				} else {
					video.style.width = videoWidth + 'px';
					video.style.height = videoHeight + 'px';
				}
			} );
		} );
	}

	function init() {
		window.addEventListener( 'load', responsiveVideos );
		window.addEventListener( 'resize', function () {
			clearTimeout( resizeTimer );
			resizeTimer = setTimeout( responsiveVideos, 500 );
		} );
		window.addEventListener( 'is.post-load', responsiveVideos );
		setTimeout( responsiveVideos );
	}

	if ( document.readyState !== 'loading' ) {
		init();
	} else {
		document.addEventListener( 'DOMContentLoaded', init );
	}
} )();
