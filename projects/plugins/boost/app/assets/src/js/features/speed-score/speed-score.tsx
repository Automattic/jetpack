import {
	getScoreLetter,
	didScoresChange,
	getScoreMovementPercentage,
} from '@automattic/jetpack-boost-score-api';
import { BoostScoreBar, Button } from '@automattic/jetpack-components';
import { sprintf, __ } from '@wordpress/i18n';
import ContextTooltip from './context-tooltip/context-tooltip';
import RefreshIcon from '$svg/refresh';
import PopOut from './pop-out/pop-out';
import PerformanceHistory from '$features/performance-history/performance-history';
import ErrorNotice from '$features/error-notice/error-notice';
import classNames from 'classnames';
import React, { useState, useEffect } from 'react';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { useDebouncedRefreshScore, useSpeedScores } from './lib/hooks';

import styles from './speed-score.module.scss';

const siteIsOnline = Jetpack_Boost.site.online;

type SpeedScoreProps = {
	moduleStates: boolean[];
	criticalCssCreated: number;
	criticalCssIsGenerating: boolean;
	performanceHistoryNeedsUpgrade: boolean;
};
const SpeedScore = ( {
	moduleStates,
	criticalCssCreated,
	criticalCssIsGenerating,
	performanceHistoryNeedsUpgrade,
}: SpeedScoreProps ) => {
	const [ { status, error, scores }, loadScore ] = useSpeedScores();
	const scoreLetter = scores ? getScoreLetter( scores.current.mobile, scores.current.desktop ) : '';
	const showPrevScores = scores && didScoresChange( scores ) && ! scores.isStale;

	const [ closedScorePopOut, setClosePopOut ] = useState( false );
	const showScoreChangePopOut =
		status === 'loaded' &&
		! scores.isStale &&
		! closedScorePopOut &&
		getScoreMovementPercentage( scores );

	// Always load the score on mount.
	useEffect( () => {
		loadScore();
	}, [ loadScore ] );

	useDebouncedRefreshScore(
		{ moduleStates, criticalCssCreated, criticalCssIsGenerating },
		loadScore
	);

	// translators: %s is a letter grade, e.g. "A" or "B"
	let heading = sprintf( __( 'Overall Score: %s', 'jetpack-boost' ), scoreLetter );
	if ( status === 'loading' ) {
		heading = __( 'Loading…', 'jetpack-boost' );
	} else if ( status === 'error' ) {
		heading = __( 'Whoops, something went wrong', 'jetpack-boost' );
	}

	return (
		<>
			<div className="jb-container">
				<div id="jp-admin-notices" className="jetpack-boost-jitm-card" />
				<div
					data-testid="speed-scores"
					className={ classNames( styles[ 'speed-scores' ], { loading: status === 'loading' } ) }
				>
					{ siteIsOnline ? (
						<div className={ styles.top } data-testid="speed-scores-top">
							<h2>{ heading }</h2>
							{ status === 'loaded' && <ContextTooltip /> }
							<Button
								variant="link"
								size="small"
								weight="regular"
								className={ styles[ 'action-button' ] }
								onClick={ () => loadScore( true ) }
								disabled={ status === 'loading' }
								icon={ <RefreshIcon /> }
							>
								{ __( 'Refresh', 'jetpack-boost' ) }
							</Button>
						</div>
					) : (
						<div className={ styles.offline } data-testid="speed-scores-offline">
							<h2>{ __( 'Website Offline', 'jetpack-boost' ) }</h2>
							<p>
								{ __(
									'All Jetpack Boost features are still available, but to get a performance score you would first have to make your website available online.',
									'jetpack-boost'
								) }
							</p>
						</div>
					) }

					{ status === 'error' && (
						<ErrorNotice
							title={ __( 'Failed to load Speed Scores', 'jetpack-boost' ) }
							error={ error }
							suggestion={ __( '<action>Try again</action>', 'jetpack-boost' ) }
							vars={ {
								action: <Button size="small" variant="link" onClick={ () => loadScore( true ) } />,
							} }
						/>
					) }

					<BoostScoreBar
						prevScore={ scores.noBoost?.mobile }
						score={ scores.current.mobile }
						active={ siteIsOnline }
						isLoading={ status === 'loading' }
						showPrevScores={ showPrevScores }
						scoreBarType="mobile"
						noBoostScoreTooltip={ __( 'Your mobile score without Boost', 'jetpack-boost' ) }
					/>

					<BoostScoreBar
						prevScore={ scores.noBoost?.desktop }
						score={ scores.current.desktop }
						active={ siteIsOnline }
						isLoading={ status === 'loading' }
						showPrevScores={ showPrevScores }
						scoreBarType="desktop"
						noBoostScoreTooltip={ __( 'Your desktop score without Boost', 'jetpack-boost' ) }
					/>
				</div>
				{ siteIsOnline && <PerformanceHistory needsUpgrade={ performanceHistoryNeedsUpgrade } /> }
			</div>

			<PopOut scoreChange={ showScoreChangePopOut } onClose={ () => setClosePopOut( true ) } />
		</>
	);
};

export default function ( props: SpeedScoreProps ) {
	return (
		<DataSyncProvider>
			<SpeedScore { ...props } />
		</DataSyncProvider>
	);
}
