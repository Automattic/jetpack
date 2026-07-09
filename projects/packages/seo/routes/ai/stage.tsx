import { useDispatch } from '@wordpress/data';
import DashboardLoadError from '../../_inc/components/dashboard-load-error';
import DashboardSkeleton from '../../_inc/components/dashboard-skeleton';
import SeoDisabledStage from '../../_inc/components/seo-disabled-stage';
import DashboardPage from '../../_inc/dashboard/dashboard-page';
import { aiStore } from '../../_inc/data/ai-store';
import { AI_PATH, OVERVIEW_PATH } from '../../_inc/data/get-preloaded';
import isSeoToolsActive from '../../_inc/data/is-seo-tools-active';
import { useAiForm } from '../../_inc/data/use-ai';
import useEnsureTabData from '../../_inc/data/use-ensure-tab-data';
import AiScreen from '../../_inc/screens/ai';
import type { AiState } from '../../_inc/data/ai-types';

// The AI form controller is owned here (the route stage); it's only used on this
// route and saves through `/jetpack/v4/settings`, so it needn't persist across
// route changes. Split out so it mounts only once the data is ready — its
// one-time seed reads the store, which the gate below has populated by then.
const AiReady = () => {
	const form = useAiForm();
	return (
		<DashboardPage active="ai">
			<AiScreen form={ form } />
		</DashboardPage>
	);
};

const Stage = () => {
	const { setEnhancer } = useDispatch( aiStore );
	// AI gates on the seo-tools state, which lives in the Overview slice, so ensure
	// both are available. A recovered AI payload is pushed into the store so the
	// form (seeded from it) reflects it.
	const { status, retry } = useEnsureTabData( [
		{ path: OVERVIEW_PATH },
		{ path: AI_PATH, seed: body => setEnhancer( ( body as AiState ).enhancer ) },
	] );

	if ( status === 'loading' ) {
		return (
			<DashboardPage active="ai">
				<DashboardSkeleton />
			</DashboardPage>
		);
	}

	if ( status === 'error' ) {
		return (
			<DashboardPage active="ai">
				<DashboardLoadError onRetry={ retry } />
			</DashboardPage>
		);
	}

	// When the `seo-tools` module is off, show the enable affordance instead of the
	// AI controls — they can't save (the REST endpoints aren't registered).
	return isSeoToolsActive() ? <AiReady /> : <SeoDisabledStage active="ai" />;
};

export { Stage as stage };
