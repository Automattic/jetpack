import DashboardLoadError from '../../_inc/components/dashboard-load-error';
import DashboardSkeleton from '../../_inc/components/dashboard-skeleton';
import SeoDisabledStage from '../../_inc/components/seo-disabled-stage';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { OVERVIEW_PATH } from '../../_inc/data/get-preloaded';
import { isGated } from '../../_inc/data/is-gated';
import isSeoToolsActive from '../../_inc/data/is-seo-tools-active';
import useEnsureTabData from '../../_inc/data/use-ensure-tab-data';
import OverviewScreen from '../../_inc/screens/overview';

// `@wordpress/build` mounts the route's exported `stage` in the main area. The
// Overview reads its state from the page preload synchronously on a normal load;
// when that's missing it's fetched, showing a skeleton meanwhile and a
// recoverable error only if the fetch genuinely fails. See [use-ensure-tab-data].
const Stage = () => {
	const { status, retry } = useEnsureTabData( [ { path: OVERVIEW_PATH } ] );

	// When the `seo-tools` module is off, the page shows only the enable prompt,
	// like every other tab: the cards have nothing to act on until SEO tools are
	// turned on. Plan-gated sites (below-Premium WordPress.com) keep their reduced
	// Overview, whose two cards read core WordPress options, as before.
	if ( status === 'ready' && ! isGated() && ! isSeoToolsActive() ) {
		return <SeoDisabledStage active="overview" />;
	}

	return (
		<DashboardPage active="overview">
			{ status === 'loading' && <DashboardSkeleton /> }
			{ status === 'error' && <DashboardLoadError onRetry={ retry } /> }
			{ status === 'ready' && <OverviewScreen /> }
		</DashboardPage>
	);
};

export { Stage as stage };
