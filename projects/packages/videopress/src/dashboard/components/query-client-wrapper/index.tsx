import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardAnalytics } from '../../hooks/use-dashboard-analytics';
import { useObserveFirstRunSignals } from '../../hooks/use-first-run-state';
import ConnectionGate from '../connection-gate';
import type { ReactNode } from 'react';

const STORE_KEY = '__jetpackVideopressQueryClient' as const;

declare global {
	interface Window {
		[ STORE_KEY ]?: QueryClient;
	}
}

/**
 * Returns the singleton QueryClient for the VideoPress dashboard.
 *
 * The client is attached to `window` so that all lazy-loaded wp-build route
 * bundles share one cache instance across navigations.
 *
 * @return {QueryClient} The shared QueryClient instance.
 */
function getClient(): QueryClient {
	if ( ! window[ STORE_KEY ] ) {
		window[ STORE_KEY ] = new QueryClient( {
			defaultOptions: {
				queries: {
					staleTime: 30_000,
					retry: 1,
					refetchOnWindowFocus: false,
				},
			},
		} );
	}
	return window[ STORE_KEY ];
}

/**
 * Records what this load learned about the user. Renders nothing: it exists
 * because the observation has to happen inside both the QueryClientProvider it
 * queries through and the connection gate — an unconnected site has no library
 * to count — and neither is in scope in the wrapper's own body.
 *
 * @return Nothing.
 */
const FirstRunSignalObserver = () => {
	useObserveFirstRunSignals();

	return null;
};

const QueryClientWrapper = ( { children }: { children: ReactNode } ) => {
	// Rendered by every route stage, so it's the single shared spot to record
	// the once-per-load dashboard page view.
	useDashboardAnalytics();

	return (
		<QueryClientProvider client={ getClient() }>
			<ConnectionGate>
				{ /*
				 * Here for the same reason the page view is: every route stage
				 * passes through this wrapper, and nothing further in is common to
				 * all of them. The first-run flags used to be written from the
				 * dashboard chrome, which the video routes don't render — so a
				 * returning user who arrived on a video link was remembered as
				 * nobody. See useObserveFirstRunSignals.
				 */ }
				<FirstRunSignalObserver />
				{ children }
			</ConnectionGate>
		</QueryClientProvider>
	);
};

export default QueryClientWrapper;
