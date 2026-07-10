import DashboardLoadError from '../../_inc/components/dashboard-load-error';
import DashboardSkeleton from '../../_inc/components/dashboard-skeleton';
import SeoDisabledStage from '../../_inc/components/seo-disabled-stage';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { CONTENT_PATH } from '../../_inc/data/get-preloaded';
import isSeoToolsActive from '../../_inc/data/is-seo-tools-active';
import useEnsureTabData from '../../_inc/data/use-ensure-tab-data';
import ContentScreen from '../../_inc/screens/content';

// The Content route's main area: the DataViews list of posts/pages. Selecting a
// row writes `?postId` to the URL, which the route's `inspector` predicate uses
// to render the SEO editor in the sidebar. DataViews owns its own scroll area
// and pinned pagination, so this tab hides the footer and runs full-bleed.
const ContentRoute = () => (
	<DashboardPage active="content" showFooter={ false } flush>
		<ContentScreen />
	</DashboardPage>
);

// When the `seo-tools` module is off, show the enable affordance instead of the
// content list — its per-post SEO meta has no effect while the module is off.
const Stage = () => {
	const { status, retry } = useEnsureTabData( [ { path: CONTENT_PATH } ] );

	if ( status === 'loading' ) {
		return (
			<DashboardPage active="content" showFooter={ false } flush>
				<DashboardSkeleton />
			</DashboardPage>
		);
	}

	if ( status === 'error' ) {
		return (
			<DashboardPage active="content" showFooter={ false } flush>
				<DashboardLoadError onRetry={ retry } />
			</DashboardPage>
		);
	}

	return isSeoToolsActive() ? <ContentRoute /> : <SeoDisabledStage active="content" />;
};

export { Stage as stage };
