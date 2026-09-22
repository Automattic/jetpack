import { getScoreMovementPercentage } from '@automattic/jetpack-boost-score-api';
import { useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/ui';
import { useCallback, useEffect, useRef } from 'react';
import ScoreAlert from './score-alert';
import ErrorBoundary from '../../app/assets/src/js/features/error-boundary/error-boundary';
import { recordBoostEvent } from '../../app/assets/src/js/lib/utils/analytics';
import HistoryChartCard from './history-chart-card';
import HistoryUpsell from './history-upsell';
import { bucketHistoryDays } from './lib/history-days';
import {
	OVERVIEW_MODULES_CHANGE_EVENT,
	relayedQueryKeys,
	type ModulesStateChange,
} from './lib/modules-state-bridge';
import { useHistoryRange } from './lib/use-history-range';
import {
	canOfferUpgrade,
	isSiteOnline,
	useModulesState,
	useScoreRefreshState,
} from './lib/use-modules-state';
import {
	performanceHistoryQueryKey,
	useDismissibleAlertState,
	useHasOlderHistory,
	usePerformanceHistory,
} from './lib/use-performance-history';
import { useSpeedScores } from './lib/use-speed-scores';
import ScoreCards from './score-cards';
import './overview.scss';
import type { ReactNode } from 'react';

type Props = {
	scoresEnabled?: boolean;
	isVisible?: boolean;
	onHeaderActionChange: ( action: ReactNode ) => void;
};

export default function Overview( props: Props ) {
	const fallbackRef = useRef< HTMLDivElement >( null );
	const focusFallback = useCallback( () => fallbackRef.current?.focus(), [] );
	return (
		<ErrorBoundary
			fallback={ error => (
				<Notice.Root
					ref={ fallbackRef }
					className="jetpack-boost-overview__fallback"
					tabIndex={ -1 }
					intent="error"
					spokenMessage={
						props.isVisible !== false
							? __( 'Unable to display performance scores', 'jetpack-boost' )
							: ''
					}
				>
					<Notice.Title>
						{ __( 'Unable to display performance scores', 'jetpack-boost' ) }
					</Notice.Title>
					<Notice.Description>{ error.message }</Notice.Description>
				</Notice.Root>
			) }
		>
			<OverviewContent { ...props } focusFallback={ focusFallback } />
		</ErrorBoundary>
	);
}

function OverviewContent( {
	scoresEnabled = true,
	isVisible = true,
	onHeaderActionChange,
	focusFallback,
}: Props & { focusFallback: () => void } ) {
	const modules = useModulesState();
	const refreshState = useScoreRefreshState( modules.data );
	const [ scoreState, refreshScores ] = useSpeedScores( refreshState, scoresEnabled );
	const historyAvailable = modules.data?.performance_history?.available === true;
	const needsUpgrade = modules.data !== undefined && ! historyAvailable;
	const { range, olderRanges, dayCount, onPrevious, onNext, canGoNext } = useHistoryRange();
	const history = usePerformanceHistory( historyAvailable && isVisible, range );
	const [ freshStartCompleted, dismissFreshStart ] = useDismissibleAlertState(
		'performance_history_fresh_start'
	);
	// A window that starts on a recorded day keeps Previous enabled without older requests.
	const opensEmpty =
		history.isSuccess && ! bucketHistoryDays( history.data?.periods ?? [], range )[ 0 ]?.period;
	const olderHistory = useHasOlderHistory(
		historyAvailable && isVisible && freshStartCompleted && opensEmpty,
		olderRanges
	);
	const hasOlderHistory = opensEmpty ? olderHistory.data : undefined;
	const queryClient = useQueryClient();
	const online = isSiteOnline();
	const isLoading = scoreState.status === 'loading';

	useEffect( () => {
		const onModulesChange = ( event: Event ) => {
			const { key, data } = ( event as CustomEvent< ModulesStateChange > ).detail;
			if ( relayedQueryKeys.includes( key ) ) {
				queryClient.setQueryData( [ key ], data );
			}
		};
		window.addEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onModulesChange );
		return () => window.removeEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onModulesChange );
	}, [ queryClient ] );

	useEffect( () => {
		if ( online && scoreState.status === 'loaded' ) {
			// New scores only land in windows that end today, so older windows and their check stay cached.
			queryClient.invalidateQueries( {
				queryKey: performanceHistoryQueryKey,
				predicate: ( { queryKey } ) =>
					typeof queryKey[ 2 ] === 'number' && queryKey[ 2 ] >= Date.now(),
			} );
		}
	}, [ online, scoreState.status, queryClient ] );

	const onRefresh = useCallback(
		( source: 'header' | 'score_card' ) => {
			recordBoostEvent( 'speed_score_refresh_clicked', { source } );
			refreshScores( true );
		},
		[ refreshScores ]
	);

	useEffect( () => {
		if ( ! isVisible || ! online ) {
			return;
		}
		let action: HTMLButtonElement | null = null;
		onHeaderActionChange(
			<Button
				ref={ node => {
					action = node;
				} }
				variant="solid"
				size="compact"
				disabled={ isLoading }
				onClick={ () => onRefresh( 'header' ) }
			>
				{ __( 'Run speed test', 'jetpack-boost' ) }
			</Button>
		);
		return () => {
			// Runs on every dependency change; focusFallback is a no-op unless the fallback is mounted,
			// and React attaches the fallback ref before this removed subtree's passive cleanup runs.
			if ( action && action === action.ownerDocument.activeElement ) {
				focusFallback();
			}
			onHeaderActionChange( null );
		};
	}, [ isVisible, online, isLoading, onRefresh, onHeaderActionChange, focusFallback ] );

	if ( ! online ) {
		return (
			<div className="jetpack-boost-overview">
				<Notice.Root
					intent="info"
					spokenMessage={
						isVisible ? __( 'Website is not publicly available', 'jetpack-boost' ) : ''
					}
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
			<ScoreCards
				scores={ scoreState.scores }
				isLoading={ isLoading }
				hasScores={ scoreState.hasScores }
				error={ scoreState.error }
				onRetry={ () => onRefresh( 'score_card' ) }
				isVisible={ isVisible }
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
					spokenMessage={ isVisible ? __( 'Failed to load module settings', 'jetpack-boost' ) : '' }
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
			{ needsUpgrade ? (
				canOfferUpgrade() && (
					<HistoryUpsell range={ range } dayCount={ dayCount } isVisible={ isVisible } />
				)
			) : (
				<HistoryChartCard
					range={ range }
					dayCount={ dayCount }
					onPrevious={ onPrevious }
					onNext={ onNext }
					canGoNext={ canGoNext }
					hasOlderHistory={ hasOlderHistory }
					isVisible={ isVisible }
					data={ modules.isPending ? undefined : history.data }
					isLoading={ modules.isPending || ( historyAvailable && history.isPending ) }
					isError={ history.isError && ! history.isFetching }
					error={ history.error }
					onRetry={ () => history.refetch() }
					isFreshStart={ ! freshStartCompleted }
					onDismissFreshStart={ dismissFreshStart }
				/>
			) }
		</div>
	);
}
