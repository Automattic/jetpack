import DashboardLoadError from '../../_inc/components/dashboard-load-error';
import DashboardSkeleton from '../../_inc/components/dashboard-skeleton';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { CONTENT_PATH } from '../../_inc/data/get-preloaded';
import useEnsureTabData from '../../_inc/data/use-ensure-tab-data';
import ContentScreen from '../../_inc/screens/content';

// The Content route's main area: the DataViews list of supported content. Selecting a
// row writes `?postId` to the URL, which the route's `inspector` predicate uses
// to render the SEO editor in the sidebar. DataViews owns its own scroll area
// and pinned pagination, so this tab hides the footer and runs full-bleed.
const ContentRoute = () => (
	<DashboardPage active="content" showFooter={ false } flush>
		<ContentScreen />
	</DashboardPage>
);

const Stage = () => {
	const { status, retry } = useEnsureTabData( [ { path: CONTENT_PATH } ] );

	if ( status === 'loading' ) {
		return (
			<DashboardPage active="content">
				<DashboardSkeleton />
			</DashboardPage>
		);
	}

	if ( status === 'error' ) {
		return (
			<DashboardPage active="content">
				<DashboardLoadError onRetry={ retry } />
			</DashboardPage>
		);
	}

	return <ContentRoute />;
};

export { Stage as stage };
