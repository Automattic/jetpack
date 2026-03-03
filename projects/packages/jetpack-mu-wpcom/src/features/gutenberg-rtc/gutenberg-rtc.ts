import { addFilter } from '@wordpress/hooks';

// Register providers (e.g. PingHub) supplied by the server, and disable HTTP polling by returning only this provider.
( function register() {
	if ( typeof window === 'undefined' ) {
		return;
	}
	addFilter( 'sync.providers', 'wpcom/pinghub-provider', () => window.wpcomGutenbergRTC.providers );
} )();
