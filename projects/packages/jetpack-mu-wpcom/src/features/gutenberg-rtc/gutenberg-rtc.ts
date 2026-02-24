import { addFilter } from '@wordpress/hooks';

// Register PingHub provider and disable Http polling by returning only this provider.
( function register() {
	if ( typeof window === 'undefined' ) {
		return;
	}
	addFilter( 'sync.providers', 'wpcom/pinghub-provider', () => [] );
} )();
