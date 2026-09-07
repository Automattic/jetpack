/**
 * Types
 */
import type { PlayerCustomizationOptions } from './types';

/**
 * Player UI customization payload for the given mode.
 *
 * While the preview is active, the player shows only the poster and the big
 * play button; activating the video restores the default player UI. Both
 * payloads derive from here so they stay exact opposites.
 *
 * @param {string} mode - 'preview' or 'playback'.
 * @return {PlayerCustomizationOptions} Payload for iframeApi.customize.set().
 */
function getModeCustomization( mode: 'preview' | 'playback' ): PlayerCustomizationOptions {
	const isPreview = mode === 'preview';
	return {
		bigPlayButton: isPreview,
		playPauseAnimation: ! isPreview,
		controlBar: ! isPreview,
		shareButton: ! isPreview,
		showPoster: isPreview,
		title: ! isPreview,
	};
}

/**
 * Preview on Hover effect for VideoPress videos.
 *
 * @return {void}
 */
export function previewOnHoverEffect(): void {
	/*
	 * Pick all VideoPress video block intances,
	 * based on the class name.
	 */
	const videoPlayers = document.querySelectorAll( '.wp-block-jetpack-videopress' );
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
			autoplay: boolean;
			showControls: boolean;
		};

		try {
			previewOnHoverData = JSON.parse( dataContainer.innerHTML );
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
			return;
		}

		// Clean the data container element. It isn't needed anymore.
		dataContainer.remove();

		let userHasInteracted = false;

		const iframeApi = window.VideoPressIframeApi( iFrame, () => {
			iframeApi.status.onPlayerStatusChanged( ( oldStatus, newStatus ) => {
				if ( oldStatus === 'ready' && newStatus === 'playing' ) {
					iframeApi.controls.pause();
					iframeApi.controls.seek( previewOnHoverData.previewAtTime );

					iframeApi.customize?.set( getModeCustomization( 'preview' ) );
				}
			} );

			iframeApi.status.onTimeUpdate( playbackTime => {
				if ( userHasInteracted ) {
					return;
				}

				const playback = playbackTime * 1000;
				const start = previewOnHoverData.previewAtTime;
				const end = start + previewOnHoverData.previewLoopDuration;

				if ( playback < start || playback > end ) {
					iframeApi.controls.seek( start );
				}
			} );
		} );

		const overlay = videoPlayerElement.querySelector( '.jetpack-videopress-player__overlay' );
		if ( ! overlay ) {
			return;
		}

		/*
		 * Disable PreviewOnHover (pOH) when the player
		 * should show the controls and
		 * once the user clicks on the video (overlay).
		 */
		if ( previewOnHoverData.showControls ) {
			overlay.addEventListener( 'click', () => {
				// Set the userHasInteracted flag to true.
				userHasInteracted = true;

				overlay.remove();

				iframeApi.customize?.set( getModeCustomization( 'playback' ) );

				iframeApi.controls.seek( 0 );
			} );
		}

		// The preview stays chrome-free while hovering; only the poster toggles.
		overlay.addEventListener( 'mouseenter', () => {
			iframeApi.customize?.set( { playPauseAnimation: false, showPoster: false, title: false } );
			iframeApi.controls.play();
		} );

		overlay.addEventListener( 'mouseleave', () => {
			iframeApi.customize?.set( { playPauseAnimation: false, showPoster: true, title: false } );
			iframeApi.controls.pause();
		} );
	} );
}
