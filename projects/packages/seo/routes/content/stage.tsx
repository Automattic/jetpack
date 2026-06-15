import DashboardPage from '../../_inc/dashboard/dashboard-page';
import ContentScreen from '../../_inc/screens/content';

// The Content route's main area: the DataViews list of posts/pages. Selecting a
// row writes `?postId` to the URL, which the route's `inspector` predicate uses
// to render the SEO editor in the sidebar.
const Stage = () => (
	<DashboardPage active="content">
		<ContentScreen />
	</DashboardPage>
);

export { Stage as stage };
