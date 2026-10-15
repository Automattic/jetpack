import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
import DashboardLoadError from '../../_inc/components/dashboard-load-error';
import DashboardSkeleton from '../../_inc/components/dashboard-skeleton';
import SeoDisabledStage from '../../_inc/components/seo-disabled-stage';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { geoStore } from '../../_inc/data/geo-store';
import getOverview from '../../_inc/data/get-overview';
import { GEO_PATH, OVERVIEW_PATH } from '../../_inc/data/get-preloaded';
import { isGated } from '../../_inc/data/is-gated';
import isSeoToolsActive from '../../_inc/data/is-seo-tools-active';
import { settingsStore } from '../../_inc/data/settings-store';
import { useAiForm } from '../../_inc/data/use-ai';
import useEnsureTabData from '../../_inc/data/use-ensure-tab-data';
import GeoScreen from '../../_inc/screens/geo';
import type { AiState } from '../../_inc/data/ai-types';

// The GEO form controller is owned here (the route stage); it's only used on this
// route and saves through `/wp/v2/settings`, so it needn't persist across
// route changes. Split out so it mounts only once the data is ready — its
// one-time seed reads the store, which the gate below has populated by then.
const GeoReady = () => {
	const form = useAiForm();
	const overview = getOverview();
	const settings = useSelect( select => select( settingsStore ).getSettings(), [] );
	const navigate = useNavigate();
	const onManageVisibility = useCallback(
		() => navigate( { href: '/settings?focus=visibility' } ),
		[ navigate ]
	);
	const searchEnginesVisible =
		settings?.search_engines_visible ?? overview?.site_visibility.search_engines_visible ?? true;

	return (
		<DashboardPage active="geo">
			<GeoScreen
				form={ form }
				searchEnginesVisible={ searchEnginesVisible }
				onManageVisibility={ onManageVisibility }
			/>
		</DashboardPage>
	);
};

const Stage = () => {
	const { setEnhancer, setLlmsTxt, setCrawlers } = useDispatch( geoStore );
	const navigate = useNavigate();

	// The GEO tab is a paid feature on plan-gated sites (below-Premium WordPress.com),
	// where its tab is hidden — silently redirect to Overview if reached directly.
	const gated = isGated();
	useEffect( () => {
		if ( gated ) {
			navigate( { href: '/' } );
		}
	}, [ gated, navigate ] );

	// GEO gates on the seo-tools state, which lives in the Overview slice, so ensure
	// both are available. Every slice of a recovered GEO payload is pushed into
	// the store so the form (seeded from it) reflects it.
	const { status, retry } = useEnsureTabData( [
		{ path: OVERVIEW_PATH },
		{
			path: GEO_PATH,
			seed: body => {
				const geo = body as AiState;
				setEnhancer( geo.enhancer );
				setLlmsTxt( geo.llmsTxt );
				setCrawlers( geo.crawlers );
			},
		},
	] );

	if ( gated ) {
		return null;
	}

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

	// When the `seo-tools` module is off, show the enable affordance instead of the
	// GEO controls — they can't save (the REST endpoints aren't registered).
	return isSeoToolsActive() ? <GeoReady /> : <SeoDisabledStage active="geo" />;
};

export { Stage as stage };
