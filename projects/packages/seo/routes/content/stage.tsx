import { useEffect } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
import SeoDisabledStage from '../../_inc/components/seo-disabled-stage';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { isGated } from '../../_inc/data/is-gated';
import isSeoToolsActive from '../../_inc/data/is-seo-tools-active';
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

const Stage = () => {
	const navigate = useNavigate();

	// The Content tab is a paid feature on plan-gated sites (below-Premium
	// WordPress.com), where its tab is hidden — silently redirect to Overview if the
	// route is reached directly.
	const gated = isGated();
	useEffect( () => {
		if ( gated ) {
			navigate( { href: '/' } );
		}
	}, [ gated, navigate ] );
	if ( gated ) {
		return null;
	}

	// When the `seo-tools` module is off, show the enable affordance instead of the
	// content list — its per-post SEO meta has no effect while the module is off.
	return isSeoToolsActive() ? <ContentRoute /> : <SeoDisabledStage active="content" />;
};

export { Stage as stage };
