import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import HistoryChartCard from './history-chart-card';
import ScoreCards from './score-cards';
import { useModulesState } from '../lib/use-modules-state';
import { usePerformanceHistory } from './lib/use-performance-history';
import { useSpeedScores } from './lib/use-speed-scores';
import './overview.scss';

// Routes to the My Jetpack "Add Boost" upgrade flow — same destination
// the Boost product card's "Upgrade" button uses. Kept as a wp-admin
// relative path so it resolves correctly on subdirectory installs,
// multisite, and behind custom admin URLs.
const UPGRADE_URL = 'admin.php?page=my-jetpack#/add-boost';

/**
 * Overview tab body — Performance scores row + Historical performance card.
 *
 * Pulls the score set (with the without-Boost baseline for deltas) from
 * `useSpeedScores` and the time series from `usePerformanceHistory`. Both
 * hooks are fresh implementations under `_inc/overview/lib/` — no coupling
 * to the legacy `$features/*` store graph, so PR 4 (flip-and-retire) can
 * delete the legacy app cleanly. The Refresh affordance lives in the
 * Performance scores card header (per design) and regenerates both the
 * speed scores and the history time series.
 *
 * Free-tier sites (where `modules_state.performance_history.available` is
 * false) get a blurred dummy chart with an upgrade Notice on top —
 * mirroring the legacy `DummyGraph` treatment so the upgrade story
 * survives the modernization.
 *
 * @return The Overview tab content.
 */
export default function Overview(): JSX.Element {
	const [ scoreState, refreshScores ] = useSpeedScores();
	const history = usePerformanceHistory();
	const modulesState = useModulesState();
	const queryClient = useQueryClient();

	const isLoadingScores = scoreState.status === 'loading' || scoreState.status === 'idle';
	const isLoadingHistory = !! history.isLoading;
	const isRefreshing = isLoadingScores || isLoadingHistory;

	const needsUpgrade =
		! modulesState.isLoading && modulesState.data?.performance_history?.available === false;

	const onRefresh = useCallback( async () => {
		await refreshScores( true );
		queryClient.invalidateQueries( { queryKey: [ 'performance_history' ] } );
	}, [ refreshScores, queryClient ] );

	const onUpgrade = useCallback( () => {
		// In-tab navigation: the upgrade flow lives in My Jetpack so the
		// visitor stays inside the same wp-admin session.
		window.location.assign( UPGRADE_URL );
	}, [] );

	const refreshButton = (
		<Button
			variant="minimal"
			tone="neutral"
			size="compact"
			loading={ isRefreshing }
			disabled={ isRefreshing }
			onClick={ onRefresh }
		>
			{ __( 'Refresh', 'jetpack-boost' ) }
		</Button>
	);

	return (
		<div className="jetpack-boost-overview">
			<ScoreCards
				scores={ scoreState.scores }
				isLoading={ isLoadingScores }
				headerAction={ refreshButton }
			/>
			<HistoryChartCard
				data={ history.data ?? undefined }
				isLoading={ isLoadingHistory }
				needsUpgrade={ needsUpgrade }
				onUpgrade={ onUpgrade }
			/>
		</div>
	);
}
