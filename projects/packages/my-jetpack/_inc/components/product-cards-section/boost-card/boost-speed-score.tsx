import {
	getScoreLetter,
	requestSpeedScores,
	calculateDaysSince,
} from '@automattic/jetpack-boost-score-api';
import { Spinner, BoostScoreBar } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { arrowUp, Icon } from '@wordpress/icons';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { useProduct } from '../../../hooks/use-product';
import { PRODUCT_STATUSES } from '../../product-card/action-button';
import { useBoostTooltipCopy } from './use-boost-tooltip-copy';
import type { FC } from 'react';

import './style.scss';

const BoostSpeedScore: FC = () => {
	const { recordEvent } = useAnalytics();
	const [ isLoading, setIsLoading ] = useState( false );
	const [ speedLetterGrade, setSpeedLetterGrade ] = useState( '' );
	const [ averageSpeedScore, setAverageSpeedScore ] = useState< number | null >( null );
	const [ isSpeedScoreError, setIsSpeedScoreError ] = useState( false );
	const [ isTooltipVisible, setIsTooltipVisible ] = useState( false );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const { siteUrl = '', latestBoostSpeedScores } = getMyJetpackWindowInitialState();
	const { apiRoot, apiNonce, isSiteConnected } = useMyJetpackConnection();
	const slug = 'boost';
	const { detail } = useProduct( slug );
	const { status } = detail;
	const isBoostActive =
		status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const TODAYS_SCORE_CACHE_KEY = 'MyJetpackTodaysBoostScore';
	const DAY_IN_MILLISECONDS = 86400000;

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

	const setTodaysScoreCache = ( score: number, letter: string ) => {
		const now = new Date();

		const storageItem = {
			score: score,
			letter: letter,
			expiry: now.getTime() + DAY_IN_MILLISECONDS,
		};
		localStorage.setItem( TODAYS_SCORE_CACHE_KEY, JSON.stringify( storageItem ) );
	};

	const getTodaysScoreCache = (): { score: number; letter: string } => {
		const storageItem = localStorage.getItem( TODAYS_SCORE_CACHE_KEY );

		if ( ! storageItem ) {
			return null;
		}

		const item: { score: number; letter: string; expiry: number } = JSON.parse( storageItem );
		const now = new Date();

		// compare the expiry time of the item with the current time
		if ( now.getTime() > item.expiry ) {
			// If the item is expired, delete the item from storage
			localStorage.removeItem( TODAYS_SCORE_CACHE_KEY );
			return null;
		}
		return item;
	};

	const getSpeedScores = async () => {
		if ( ! isSiteConnected ) {
			// Don't show the Boost Score
			setIsSpeedScoreError( true );
			return;
		}

		// First look if today's score is cached in localStorage.
		const todaysCachedScore = getTodaysScoreCache();
		if ( todaysCachedScore ) {
			setAverageSpeedScore( todaysCachedScore.score );
			setSpeedLetterGrade( todaysCachedScore.letter );
			return;
		}

		// If scores not cached, fetch the scores.
		setIsLoading( true );
		try {
			const scores = await requestSpeedScores( true, apiRoot, siteUrl, apiNonce );
			const speedScoreAverage = getAverageSpeedScore(
				scores.current.mobile,
				scores.current.desktop
			);
			const scoreLetter = getScoreLetter( scores.current.mobile, scores.current.desktop );
			setTodaysScoreCache( speedScoreAverage, scoreLetter );
			setAverageSpeedScore( speedScoreAverage );
			setSpeedLetterGrade( scoreLetter );
			setIsLoading( false );
		} catch ( err ) {
			recordEvent( 'jetpack_boost_speed_score_error', {
				feature: 'jetpack-boost',
				position: 'my-jetpack',
				error: err,
			} );

			// If error, use the cached "latest" speed scores if they exist
			if ( latestBoostSpeedScores && latestBoostSpeedScores.scores ) {
				setScoresFromCache( latestBoostSpeedScores );
			} else {
				// Hide Boost scores if error and no cached scores
				setIsSpeedScoreError( true );
			}

			setIsLoading( false );
		}
	};

	const boostScoreIncrease = useMemo( () => {
		if ( ! latestBoostSpeedScores || ! averageSpeedScore ) {
			return null;
		}
		const { scores } = latestBoostSpeedScores;
		const { mobile, desktop } = scores;
		const latestScoresAverage = getAverageSpeedScore( mobile, desktop );

		// Only return an increase. Don't return a negative value (decrease).
		if ( averageSpeedScore < latestScoresAverage ) {
			return null;
		}

		return averageSpeedScore - latestScoresAverage;
	}, [ averageSpeedScore, latestBoostSpeedScores ] );

	const tooltipCopy = useBoostTooltipCopy( { speedLetterGrade, boostScoreIncrease } );

	const handleTooltipMouseEnter = useCallback( () => {
		setIsTooltipVisible( true );
	}, [ setIsTooltipVisible ] );

	const handleTooltipMouseLeave = useCallback( () => {
		setIsTooltipVisible( false );
	}, [ setIsTooltipVisible ] );

	useEffect( () => {
		if ( latestBoostSpeedScores ) {
			if ( isBoostActive ) {
				getSpeedScores();
			} else if ( calculateDaysSince( latestBoostSpeedScores.timestamp * 1000 ) < 14 ) {
				// When Boost plugin is not installed or activated, use cache scores if they are less than 2 weeks old (14 days).
				setScoresFromCache( latestBoostSpeedScores );
			} else {
				// Boost is not active and cached scores are older than 2 weeks.
				getSpeedScores();
			}
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
								score={
									averageSpeedScore ||
									getAverageSpeedScore(
										latestBoostSpeedScores.scores.mobile,
										latestBoostSpeedScores.scores.desktop
									)
								}
								active={ averageSpeedScore > 0 }
								isLoading={ isLoading }
								showPrevScores={ false }
								scoreBarType="desktop"
								noBoostScoreTooltip={ null }
							/>
						</div>
						{ !! boostScoreIncrease && (
							<div className="mj-boost-speed-score__increase">
								<Icon size={ 18 } icon={ arrowUp } />
								<span>{ boostScoreIncrease }</span>
							</div>
						) }
					</>
				) }
			</div>
		)
	);
};

export default BoostSpeedScore;
