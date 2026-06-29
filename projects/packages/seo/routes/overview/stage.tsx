import DashboardPage from '../../_inc/dashboard/dashboard-page';
import OverviewScreen from '../../_inc/screens/overview';

// `@wordpress/build` mounts the route's exported `stage` in the main area. The
// Overview screen reads its bootstrapped state synchronously, so the stage just
// wraps it in the shared dashboard chrome.
const Stage = () => (
	<DashboardPage active="overview">
		<OverviewScreen />
	</DashboardPage>
);

export { Stage as stage };
