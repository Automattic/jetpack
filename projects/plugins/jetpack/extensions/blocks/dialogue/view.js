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
	// Play podcast by cliking on the timestamp label
	document.body.addEventListener( 'click', event => {
		if ( ! event?.target?.classList?.contains( 'wp-block-jetpack-dialogue__timestamp_link' ) ) {
			return;
		}

		const timestamp = event.target?.href?.split( '#' )?.[ 1 ];
		if ( ! timestamp ) {
			return;
		}

		const mediaSource = select( STORE_ID )?.getDefaultMediaSource();
		if ( ! mediaSource ) {
			return;
		}

		event.preventDefault();
		dispatch( STORE_ID ).setMediaSourceCurrentTime( mediaSource.id, timestamp );
		dispatch( STORE_ID ).playMediaSource( mediaSource.id, timestamp );
	} );
} );
