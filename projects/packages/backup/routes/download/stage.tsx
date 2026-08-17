import QueryClientProvider from '../../src/dashboard/providers/query-client-provider';
import DownloadScreen from '../../src/dashboard/screens/download';
import './style.scss';

/**
 * wp-build stage: boot mounts this into the page's app container.
 *
 * See `routes/dashboard/stage.tsx` for why the provider lives in the
 * stage rather than in `<DashboardLayout>`.
 *
 * @return The Download screen wrapped in the dashboard's query client.
 */
const Stage = () => (
	<QueryClientProvider>
		<DownloadScreen />
	</QueryClientProvider>
);

export { Stage as stage };
