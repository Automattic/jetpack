import { QueryClientProvider } from '@tanstack/react-query';
import { useDashboardAnalytics, type DashboardRoute } from '../../hooks/use-dashboard-analytics';
import { useObserveFirstRunSignals } from '../../hooks/use-first-run-state';
import { getQueryClient } from '../../utils/query-client';
import ConnectionGate from '../connection-gate';
import type { ReactNode } from 'react';

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

const QueryClientWrapper = ( {
	children,
	route,
}: {
	children: ReactNode;
	route: DashboardRoute;
} ) => {
	// Rendered by every route stage, so it's the single shared spot to record
	// the once-per-load dashboard page view.
	useDashboardAnalytics( route );

	return (
		<QueryClientProvider client={ getQueryClient() }>
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
