import { addFilter } from '@wordpress/hooks';
import { PingHubIframeBridge } from './pinghub/pinghub-bridge';
import { createPingHubProvider } from './pinghub/pinghub-provider';
import type { ProviderCreator } from './pinghub/pinghub-provider';

// Register PingHub provider and disable Http polling by returning only this provider.
( function register() {
	if ( typeof window === 'undefined' ) return;
	// Only run inside the block editor context
	const bridge = new PingHubIframeBridge();
	const pingHubProvider: ProviderCreator = createPingHubProvider( bridge );

	addFilter( 'sync.providers', 'wpcom/pinghub-provider', () => [ pingHubProvider ] );
} )();
