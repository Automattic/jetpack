import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createReduxStore, register } from '@wordpress/data';
import * as WPElement from '@wordpress/element';
import React from 'react';
import Admin from './components/Admin';
import { STORE_ID, storeConfig } from './store';

const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			staleTime: Infinity,
		},
	},
} );

const store = createReduxStore( STORE_ID, storeConfig );
register( store );

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-backup-root' );

	if ( null === container ) {
		return;
	}

	const component = (
		<QueryClientProvider client={ queryClient }>
			<ThemeProvider>
				<Admin />
			</ThemeProvider>
		</QueryClientProvider>
	);
	WPElement.createRoot( container ).render( component );
}

render();
