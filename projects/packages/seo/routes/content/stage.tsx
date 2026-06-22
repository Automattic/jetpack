import DashboardPage from '../../_inc/dashboard/dashboard-page';
import ContentScreen from '../../_inc/screens/content';

// The Content route's main area: the DataViews list of posts/pages. Selecting a
// row writes `?postId` to the URL, which the route's `inspector` predicate uses
// to render the SEO editor in the sidebar. DataViews owns its own scroll area
// and pinned pagination, so this tab hides the footer and runs full-bleed.
const Stage = () => (
	<DashboardPage active="content" showFooter={ false } flush>
		<ContentScreen />
	</DashboardPage>
);

export { Stage as stage };
