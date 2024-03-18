import {
	getScoreLetter,
	requestSpeedScores,
	calculateDaysSince,
} from '@automattic/jetpack-boost-score-api';
import { Spinner, BoostScoreBar } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect, useState } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { useBoostTooltipCopy } from './use-boost-tooltip-copy';
import type { FC } from 'react';

import './style.scss';

const BoostSpeedScore: FC = () => {
	const { recordEvent } = useAnalytics();
	const [ isLoading, setIsLoading ] = useState( false );
	const [ speedLetterGrade, setSpeedLetterGrade ] = useState( '' );
	const [ averageSpeedScore, setAverageSpeedScore ] = useState( 0 );
	const [ isSpeedScoreError, setIsSpeedScoreError ] = useState( false );
	const [ isTooltipVisible, setIsTooltipVisible ] = useState( false );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const { siteSuffix: siteUrl = '', latestBoostSpeedScores } = getMyJetpackWindowInitialState();
	const { apiRoot, apiNonce, isSiteConnected } = useMyJetpackConnection();

	const getAverageSpeedScore = ( mobileScore, desktopScore ) => {
		return Math.round( ( mobileScore + desktopScore ) / 2 );
	};

	const setScoresFromCache = cachedSpeedScores => {
		setAverageSpeedScore(
			getAverageSpeedScore( cachedSpeedScores.scores.mobile, cachedSpeedScores.scores.desktop )
		);
		setSpeedLetterGrade(
			getScoreLetter( cachedSpeedScores.scores.mobile, cachedSpeedScores.scores.desktop )
		);
	};

	const getSpeedScores = async () => {
		if ( ! isSiteConnected ) {
			setIsSpeedScoreError( true );
			return;
		}

		setIsLoading( true );
		try {
			const scores = await requestSpeedScores( true, apiRoot, siteUrl, apiNonce );
			const scoreLetter = getScoreLetter( scores.current.mobile, scores.current.desktop );
			setSpeedLetterGrade( scoreLetter );
			setAverageSpeedScore( getAverageSpeedScore( scores.current.mobile, scores.current.desktop ) );
			setIsLoading( false );
		} catch ( err ) {
			recordEvent( 'jetpack_boost_speed_score_error', {
				feature: 'jetpack-boost',
				position: 'my-jetpack',
				error: err,
			} );

			// If error, use cached speed scores if they exist
			if ( latestBoostSpeedScores && latestBoostSpeedScores.scores ) {
				setScoresFromCache( latestBoostSpeedScores );
			} else {
				// Hide score bars if error and no cached scores
				setIsSpeedScoreError( true );
			}

			setIsLoading( false );
		}
	};

	const tooltipCopy = useBoostTooltipCopy( { speedLetterGrade } );

	const handleTooltipMouseEnter = useCallback( () => {
		setIsTooltipVisible( true );
	}, [ setIsTooltipVisible ] );

	const handleTooltipMouseLeave = useCallback( () => {
		setIsTooltipVisible( false );
	}, [ setIsTooltipVisible ] );

	useEffect( () => {
		// Use cache scores if they are less than 21 days old.
		if (
			latestBoostSpeedScores &&
			calculateDaysSince( latestBoostSpeedScores.timestamp * 1000 ) < 21
		) {
			setScoresFromCache( latestBoostSpeedScores );
		} else {
			getSpeedScores();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		! isSpeedScoreError && (
			<div className="mj-boost-speed-score">
				{ isLoading ? (
					<Spinner color="#23282d" size={ 16 } />
				) : (
					<>
						<div className="mj-boost-speed-score__grade">
							<span>{ __( 'Your website’s overall speed score:', 'jetpack-my-jetpack' ) }</span>
							<span className="mj-boost-speed-score__grade--letter">
								<button
									onMouseEnter={ handleTooltipMouseEnter }
									onFocus={ handleTooltipMouseEnter }
									onMouseLeave={ handleTooltipMouseLeave }
									onBlur={ handleTooltipMouseLeave }
								>
									{ speedLetterGrade }
									{ isTooltipVisible && (
										<Popover
											placement={ isMobileViewport ? 'top-end' : 'right' }
											noArrow={ false }
											offset={ 10 }
										>
											<p className={ 'boost-score-tooltip__heading' }>
												{ /* Add the `&nbsp;` at the end to prevent widows. */ }
												{ __( 'Site speed performance:', 'jetpack-my-jetpack' ) }&nbsp;
												{ speedLetterGrade }
											</p>
											<p className={ 'boost-score-tooltip__content' }>{ tooltipCopy }</p>
										</Popover>
									) }
								</button>
							</span>
						</div>
						<div className="mj-boost-speed-score__bar">
							<BoostScoreBar
								score={ averageSpeedScore }
								active={ averageSpeedScore > 0 }
								isLoading={ isLoading }
								showPrevScores={ false }
								scoreBarType="desktop"
								noBoostScoreTooltip={ null }
							/>
						</div>
					</>
				) }
			</div>
		)
	);
};

export default BoostSpeedScore;
