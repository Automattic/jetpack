import { addFilter } from '@wordpress/hooks';
import { Y } from '@wordpress/sync';

const win = window as unknown as { wp?: { sync?: { Y?: unknown } } };
if ( win.wp?.sync?.Y ) {
	// eslint-disable-next-line no-console
	console.assert( Y === win.wp.sync.Y, 'ERROR: Two Yjs instances detected!' );
	// eslint-disable-next-line no-console
	console.log( 'Yjs instance check passed:', Y === win.wp.sync.Y );
} else {
	// eslint-disable-next-line no-console
	console.error( 'Yjs instance not found!' );
}

// Register PingHub provider and disable Http polling by returning only this provider.
( function register() {
	if ( typeof window === 'undefined' ) {
		return;
	}
	addFilter( 'sync.providers', 'wpcom/pinghub-provider', () => [] );
} )();
