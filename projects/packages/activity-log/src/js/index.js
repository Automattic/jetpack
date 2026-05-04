import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as WPElement from '@wordpress/element';
import ActivityLog from './components/ActivityLog';
import './style.scss';

// The activity log is append-only: new events land upstream while this
// page stays open, so a cached snapshot goes stale within seconds.
// A finite `staleTime` + `refetchOnWindowFocus` keeps the list current
// without hammering WPCOM on every keystroke — react-query still
// de-dupes requests that share a key inside the window.
const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			staleTime: 60_000,
			refetchOnWindowFocus: true,
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
