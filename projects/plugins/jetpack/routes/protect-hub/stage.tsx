import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearch } from '@wordpress/route';
import ProtectDashboard, { toTab } from '../../_inc/client/protect-dashboard';
import './route.scss';

const queryClient = new QueryClient( {
	defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
} );

/**
 * Boot stage for the Protect dashboard; the active tab lives in `?tab=`.
 *
 * @return The Protect dashboard.
 */
function Stage(): JSX.Element {
	const search = useSearch( { from: '/' as unknown as never, strict: false } ) as {
		tab?: string;
	};

	return (
		<QueryClientProvider client={ queryClient }>
			<ProtectDashboard activeTab={ toTab( search.tab ) } />
		</QueryClientProvider>
	);
}

export { Stage as stage };
