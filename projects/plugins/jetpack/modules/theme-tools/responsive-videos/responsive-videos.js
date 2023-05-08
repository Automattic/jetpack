import './responsive-videos.css';

let resizeTimer;

/**
 * Resize all videos in the document.
 */
function responsiveVideos() {
	document.querySelectorAll( '.jetpack-video-wrapper' ).forEach( function ( wrapper ) {
		wrapper.querySelectorAll( 'embed, iframe, object' ).forEach( function ( video ) {
			let videoMargin = 0;

			const previousSibling = wrapper.previousElementSibling;
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

			const videoWidth = video.getAttribute( 'data-width' );
			const videoHeight = video.getAttribute( 'data-height' );
			const videoRatio = video.getAttribute( 'data-ratio' );
			const containerWidth = video.parentElement.clientWidth;

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

/**
 * Initialize event listeners and resize everything straight away.
 */
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
