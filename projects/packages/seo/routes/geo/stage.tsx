import { useDispatch, useSelect } from '@wordpress/data';
import DashboardLoadError from '../../_inc/components/dashboard-load-error';
import DashboardSkeleton from '../../_inc/components/dashboard-skeleton';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { geoStore } from '../../_inc/data/geo-store';
import getOverview from '../../_inc/data/get-overview';
import { GEO_PATH, OVERVIEW_PATH } from '../../_inc/data/get-preloaded';
import { settingsStore } from '../../_inc/data/settings-store';
import useEnsureTabData from '../../_inc/data/use-ensure-tab-data';
import { useGeoForm } from '../../_inc/data/use-geo';
import GeoScreen from '../../_inc/screens/geo';
import type { GeoState } from '../../_inc/data/geo-types';

// The GEO form controller is owned here (the route stage); it's only used on this
// route and saves through `/wp/v2/settings`, so it needn't persist across
// route changes. Split out so it mounts only once the data is ready — its
// one-time seed reads the store, which the gate below has populated by then.
const GeoReady = () => {
	const form = useGeoForm();
	const overview = getOverview();
	const settings = useSelect( select => select( settingsStore ).getSettings(), [] );
	const searchEnginesVisible =
		settings?.search_engines_visible ?? overview?.site_visibility.search_engines_visible ?? true;

	return (
		<DashboardPage active="geo">
			<GeoScreen form={ form } searchEnginesVisible={ searchEnginesVisible } />
		</DashboardPage>
	);
};

const Stage = () => {
	const { setEnhancer, setLlmsTxt, setCrawlers } = useDispatch( geoStore );

	// GEO falls back to the Overview slice for search visibility, so ensure both are
	// available. Every slice of a recovered GEO payload is pushed into the store so
	// the form (seeded from it) reflects it.
	const { status, retry } = useEnsureTabData( [
		{ path: OVERVIEW_PATH },
		{
			path: GEO_PATH,
			seed: body => {
				const geo = body as GeoState;
				setEnhancer( geo.enhancer );
				setLlmsTxt( geo.llmsTxt );
				setCrawlers( geo.crawlers );
			},
		},
	] );

	if ( status === 'loading' ) {
		return (
			<DashboardPage active="geo">
				<DashboardSkeleton />
			</DashboardPage>
		);
	}

	if ( status === 'error' ) {
		return (
			<DashboardPage active="geo">
				<DashboardLoadError onRetry={ retry } />
			</DashboardPage>
		);
	}

	return <GeoReady />;
};

export { Stage as stage };
