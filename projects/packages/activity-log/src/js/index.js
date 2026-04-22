import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as WPElement from '@wordpress/element';
import Admin from './components/Admin';

const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			staleTime: Infinity,
		},
	},
} );

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-activity-log-root' );

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
