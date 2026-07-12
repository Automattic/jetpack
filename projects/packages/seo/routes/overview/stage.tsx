import DashboardLoadError from '../../_inc/components/dashboard-load-error';
import DashboardSkeleton from '../../_inc/components/dashboard-skeleton';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { OVERVIEW_PATH } from '../../_inc/data/get-preloaded';
import useEnsureTabData from '../../_inc/data/use-ensure-tab-data';
import OverviewScreen from '../../_inc/screens/overview';

// `@wordpress/build` mounts the route's exported `stage` in the main area. The
// Overview reads its state from the page preload synchronously on a normal load;
// when that's missing it's fetched, showing a skeleton meanwhile and a
// recoverable error only if the fetch genuinely fails. See [use-ensure-tab-data].
const Stage = () => {
	const { status, retry } = useEnsureTabData( [ { path: OVERVIEW_PATH } ] );

	return (
		<DashboardPage active="overview">
			{ status === 'loading' && <DashboardSkeleton /> }
			{ status === 'error' && <DashboardLoadError onRetry={ retry } /> }
			{ status === 'ready' && <OverviewScreen /> }
		</DashboardPage>
	);
};

export { Stage as stage };
