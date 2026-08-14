import QueryClientProvider from '../../src/dashboard/providers/query-client-provider';
import RestoreScreen from '../../src/dashboard/screens/restore';
import './style.scss';

/**
 * wp-build stage: boot mounts this into the page's app container.
 *
 * See `routes/dashboard/stage.tsx` for why the provider lives in the
 * stage rather than in `<DashboardLayout>`.
 *
 * @return The Restore screen wrapped in the dashboard's query client.
 */
const Stage = () => (
	<QueryClientProvider>
		<RestoreScreen />
	</QueryClientProvider>
);

export { Stage as stage };
