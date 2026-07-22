import { ThemeProvider } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActivityLog from '../../src/js/components/ActivityLog';
import '../../src/js/style.scss';
import './route.scss';

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
 * wp-build stage: boot mounts this into the page's app container.
 *
 * @return The Activity Log dashboard tree.
 */
const Stage = () => (
	<QueryClientProvider client={ queryClient }>
		<ThemeProvider>
			<ActivityLog />
		</ThemeProvider>
	</QueryClientProvider>
);

export { Stage as stage };
