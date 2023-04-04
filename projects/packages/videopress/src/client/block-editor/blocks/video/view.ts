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
	const videoPlayers = document.querySelectorAll( '.wp-block-videopress-video' );
	if ( videoPlayers.length === 0 ) {
		return;
	}

	videoPlayers.forEach( function ( videoPlayerElement: HTMLDivElement ) {
		// Get the iFrame element.
		const iFrame = videoPlayerElement.querySelector( 'iframe' );
		if ( ! iFrame ) {
			return;
		}

		// Get the data container element.
		const dataContainer: HTMLScriptElement = videoPlayerElement.querySelector(
			'script[type="application/json"]'
		);

		/*
		 * Try to pick the POH data from the data container element.
		 * If it fails, log the error and return.
		 */
		let previewOnHoverData: {
			previewAtTime: number;
			previewLoopDuration: number;
		};

		try {
			previewOnHoverData = JSON.parse( dataContainer.text );
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
			return;
		}

		// Clean the data container element. It isn't needed anymore.
		dataContainer.remove();

		console.log( 'previewOnHoverData: ', previewOnHoverData ); // eslint-disable-line no-console
	} );
}

domReady( function () {
	previewOnHoverEffect();
} );
