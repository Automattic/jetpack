import ErrorBoundary from '../../src/dashboard/components/error-boundary';
import QueryClientProvider from '../../src/dashboard/providers/query-client-provider';
import OverviewScreen from '../../src/dashboard/screens/overview';
import './style.scss';

/**
 * wp-build stage: boot mounts this into the page's app container.
 *
 * The provider has to sit here rather than inside `<DashboardLayout>`:
 * the screen calls React Query hooks in its own body, and React runs a
 * component's hooks before it renders that component's children — so a
 * provider mounted by the layout would never be in scope.
 *
 * `<ErrorBoundary>` is outermost so it also covers the provider, and
 * because the screen's own hooks run before it renders `<DashboardLayout>`
 * — a boundary inside the layout would never mount in time to catch them.
 * The trade-off is that the fallback renders without the page chrome.
 *
 * @return The Overview screen wrapped in the dashboard's query client.
 */
const Stage = () => (
	<ErrorBoundary>
		<QueryClientProvider>
			<OverviewScreen />
		</QueryClientProvider>
	</ErrorBoundary>
);

export { Stage as stage };
