import { getScoreMovementPercentage } from '@automattic/jetpack-boost-score-api';
import { useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/ui';
import { useEffect } from 'react';
import ScoreAlert from './score-alert';
import ErrorBoundary from '../../app/assets/src/js/features/error-boundary/error-boundary';
import { recordBoostEvent } from '../../app/assets/src/js/lib/utils/analytics';
import HistoryChartCard from './history-chart-card';
import { OVERVIEW_MODULES_CHANGE_EVENT } from './lib/modules-state-bridge';
import {
	isSiteOnline,
	modulesStateQueryKey,
	useModulesState,
	useScoreRefreshState,
} from './lib/use-modules-state';
import {
	performanceHistoryQueryKey,
	useDismissibleAlertState,
	usePerformanceHistory,
} from './lib/use-performance-history';
import { useSpeedScores } from './lib/use-speed-scores';
import ScoreCards from './score-cards';
import './overview.scss';

export default function Overview( props: { isVisible?: boolean } ) {
	return (
		<ErrorBoundary
			fallback={ error => (
				<Notice.Root
					intent="error"
					spokenMessage={ __( 'Unable to display performance scores', 'jetpack-boost' ) }
				>
					<Notice.Title>
						{ __( 'Unable to display performance scores', 'jetpack-boost' ) }
					</Notice.Title>
					<Notice.Description>{ error.message }</Notice.Description>
				</Notice.Root>
			) }
		>
			<OverviewContent { ...props } />
		</ErrorBoundary>
	);
}

function OverviewContent( { isVisible = true }: { isVisible?: boolean } ) {
	const modules = useModulesState();
	const refreshState = useScoreRefreshState( modules.data );
	const [ scoreState, refreshScores ] = useSpeedScores( refreshState );
	const history = usePerformanceHistory( modules.data?.performance_history?.available === true );
	const [ freshStartCompleted, dismissFreshStart ] = useDismissibleAlertState(
		'performance_history_fresh_start'
	);
	const queryClient = useQueryClient();
	const online = isSiteOnline();
	const isLoading = scoreState.status === 'loading';

	useEffect( () => {
		const onModulesChange = () => {
			queryClient.invalidateQueries( { queryKey: modulesStateQueryKey } );
		};
		window.addEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onModulesChange );
		return () => window.removeEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onModulesChange );
	}, [ queryClient ] );

	useEffect( () => {
		if ( online && scoreState.status === 'loaded' ) {
			queryClient.invalidateQueries( { queryKey: performanceHistoryQueryKey } );
		}
	}, [ online, scoreState.status, queryClient ] );

	const onRefresh = () => {
		recordBoostEvent( 'speed_score_refresh_clicked', {} );
		refreshScores( true );
	};

	if ( ! online ) {
		return (
			<div className="jetpack-boost-overview">
				<Notice.Root
					intent="info"
					spokenMessage={ __( 'Website is not publicly available', 'jetpack-boost' ) }
				>
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
			{ scoreState.status === 'error' && (
				<Notice.Root
					intent="error"
					spokenMessage={ __( 'Failed to load Speed Scores', 'jetpack-boost' ) }
				>
					<Notice.Title>{ __( 'Failed to load Speed Scores', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>{ scoreState.error?.message }</Notice.Description>
					<Notice.Actions>
						<Notice.ActionButton onClick={ () => refreshScores( true ) }>
							{ __( 'Try again', 'jetpack-boost' ) }
						</Notice.ActionButton>
					</Notice.Actions>
				</Notice.Root>
			) }
			<ScoreCards
				scores={ scoreState.scores }
				isLoading={ isLoading }
				showPlaceholder={ isLoading || ! scoreState.hasScores }
				headerAction={
					<Button variant="minimal" size="compact" disabled={ isLoading } onClick={ onRefresh }>
						{ __( 'Refresh', 'jetpack-boost' ) }
					</Button>
				}
			/>
			<ScoreAlert
				scoreChange={
					scoreState.status === 'loaded' &&
					! scoreState.scores.isStale &&
					getScoreMovementPercentage( scoreState.scores )
				}
				isVisible={ isVisible }
			/>
			{ modules.isError && (
				<Notice.Root
					intent="error"
					spokenMessage={ __( 'Failed to load module settings', 'jetpack-boost' ) }
				>
					<Notice.Title>{ __( 'Failed to load module settings', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>{ modules.error.message }</Notice.Description>
					<Notice.Actions>
						<Notice.ActionButton onClick={ () => modules.refetch() }>
							{ __( 'Try again', 'jetpack-boost' ) }
						</Notice.ActionButton>
					</Notice.Actions>
				</Notice.Root>
			) }
			<HistoryChartCard
				isVisible={ isVisible }
				data={ modules.isPending ? undefined : history.data }
				isLoading={ modules.isPending || history.isPending }
				isError={ history.isError && ! history.isFetching }
				error={ history.error }
				onRetry={ () => history.refetch() }
				needsUpgrade={
					modules.data !== undefined && modules.data.performance_history?.available !== true
				}
				isFreshStart={ ! freshStartCompleted }
				onDismissFreshStart={ dismissFreshStart }
			/>
		</div>
	);
}
