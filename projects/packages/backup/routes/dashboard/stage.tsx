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
 * @return The Overview screen wrapped in the dashboard's query client.
 */
const Stage = () => (
	<QueryClientProvider>
		<OverviewScreen />
	</QueryClientProvider>
);

export { Stage as stage };
