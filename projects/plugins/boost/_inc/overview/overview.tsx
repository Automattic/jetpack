import { useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/ui';
import { useEffect } from 'react';
import { recordBoostEvent } from '../../app/assets/src/js/lib/utils/analytics';
import HistoryChartCard from './history-chart-card';
import { useModulesState, useScoreRefreshState } from './lib/use-modules-state';
import { useDismissibleAlertState, usePerformanceHistory } from './lib/use-performance-history';
import { useSpeedScores } from './lib/use-speed-scores';
import ScoreCards from './score-cards';
import './overview.scss';

export default function Overview() {
	const modules = useModulesState();
	const refreshState = useScoreRefreshState( modules.data );
	const [ scoreState, refreshScores ] = useSpeedScores( refreshState );
	const history = usePerformanceHistory();
	const [ freshStartCompleted, dismissFreshStart ] = useDismissibleAlertState(
		'performance_history_fresh_start'
	);
	const queryClient = useQueryClient();
	const online = Jetpack_Boost.site.online;
	const isLoading = scoreState.status === 'loading';

	useEffect( () => {
		if ( online && scoreState.status === 'loaded' ) {
			queryClient.invalidateQueries( { queryKey: [ 'performance_history' ] } );
		}
	}, [ online, scoreState, queryClient ] );

	const onRefresh = () => {
		recordBoostEvent( 'speed_score_refresh_clicked', {} );
		refreshScores( true );
	};

	if ( ! online ) {
		return (
			<div className="jetpack-boost-overview">
				<Notice.Root intent="info">
					<Notice.Title>
						{ __( 'Website is not publicly available', 'jetpack-boost' ) }
					</Notice.Title>
					<Notice.Description>
						{ __(
							'Performance score and some other Boost features cannot work because the Boost Cloud cannot reach your website. To fix this, you need to make your website publicly available.',
							'jetpack-boost'
						) }
					</Notice.Description>
				</Notice.Root>
			</div>
		);
	}

	return (
		<div className="jetpack-boost-overview">
			{ scoreState.status === 'error' ? (
				<Notice.Root intent="error">
					<Notice.Title>{ __( 'Failed to load Speed Scores', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>{ scoreState.error?.message }</Notice.Description>
					<Notice.Actions>
						<Button onClick={ () => refreshScores( true ) }>
							{ __( 'Try again', 'jetpack-boost' ) }
						</Button>
					</Notice.Actions>
				</Notice.Root>
			) : (
				<ScoreCards
					scores={ scoreState.scores }
					isLoading={ isLoading }
					headerAction={
						<Button variant="minimal" size="compact" disabled={ isLoading } onClick={ onRefresh }>
							{ __( 'Refresh', 'jetpack-boost' ) }
						</Button>
					}
				/>
			) }
			<HistoryChartCard
				data={ modules.isPending ? undefined : history.data }
				isLoading={ modules.isPending || ( history.isFetching && ! history.data?.periods.length ) }
				isError={ modules.isError || ( history.isError && ! history.isFetching ) }
				onRetry={ () => {
					modules.refetch();
					history.refetch();
				} }
				needsUpgrade={ ! modules.isPending && ! modules.data?.performance_history?.available }
				isFreshStart={ ! freshStartCompleted }
				onDismissFreshStart={ dismissFreshStart }
			/>
		</div>
	);
}
