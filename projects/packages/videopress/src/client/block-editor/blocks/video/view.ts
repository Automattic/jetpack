/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Preview on Hover effect for VideoPress videos.
 *
 * @returns {void}
 */
function previewOnHoverEffect(): void {
	/*
	 * Pick all VideoPress video block intances,
	 * based on the class name.
	 */
	const videoPlayers = document.querySelectorAll( '.wp-block-jetpack-videopress-container' );
	if ( videoPlayers.length === 0 ) {
		return;
	}

	videoPlayers.forEach( function ( videoPlayerElement: HTMLDivElement ) {
		// Get the iFrame element.
		const iFrame = videoPlayerElement.querySelector( 'iframe' );
		if ( ! iFrame ) {
			return;
		}

		// If the VideoPress iFrame API is not available, return.
		if ( ! window?.VideoPressIframeApi ) {
			return;
		}

		/*
		 * Try to pick the POH data from the data container element.
		 * If it fails, log the error and return.
		 */
		const dataContainer = videoPlayerElement.querySelector( 'script[type="application/json"]' );
		if ( ! dataContainer ) {
			return;
		}

		let previewOnHoverData: {
			previewAtTime: number;
			previewLoopDuration: number;
		};

		try {
			previewOnHoverData = JSON.parse( dataContainer.innerHTML );
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
			return;
		}

		// Clean the data container element. It isn't needed anymore.
		dataContainer.remove();

		const iframeApi = window.VideoPressIframeApi( iFrame, () => {
			iframeApi.status.onPlayerStatusChanged( ( oldStatus, newStatus ) => {
				if ( oldStatus === 'ready' && newStatus === 'playing' ) {
					iframeApi.controls.pause();
					iframeApi.controls.seek( previewOnHoverData.previewAtTime );
				}
			} );

			iframeApi.status.onTimeUpdate( playbackTime => {
				const playback = playbackTime * 1000;
				const start = previewOnHoverData.previewAtTime;
				const end = start + previewOnHoverData.previewLoopDuration;

				if ( playback < start || playback > end ) {
					iframeApi.controls.seek( start );
				}
			} );
		} );

		videoPlayerElement.addEventListener( 'mouseenter', iframeApi.controls.play );
		videoPlayerElement.addEventListener( 'mouseleave', iframeApi.controls.pause );
	} );
}

domReady( function () {
	previewOnHoverEffect();
} );
