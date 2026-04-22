import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as WPElement from '@wordpress/element';
import ActivityLog from './components/ActivityLog';
import './style.scss';

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
				<ActivityLog />
			</ThemeProvider>
		</QueryClientProvider>
	);
	WPElement.createRoot( container ).render( component );
}

render();
