/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { select, dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import './style.scss';

const STORE_ID = 'jetpack/media-source';

domReady( function () {
	document.body.addEventListener( 'click', event => {
		console.log( event?.target.innerText );
		if ( ! event?.target?.classList?.contains( 'wp-block-jetpack-dialogue__timestamp_link' ) ) {
			return;
		}

		const timestamp = mejs.Utils.timeCodeToSeconds( event.target.innerText );
		const currentMediaSource = select( STORE_ID ).getCurrent();
		if ( ! currentMediaSource ) {
			return;
		}

		event.preventDefault();

		const { playMediaInPosition } = dispatch( STORE_ID );
		playMediaInPosition( currentMediaSource.id, timestamp );
	} );
} );