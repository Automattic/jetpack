import {
	getScoreLetter,
	requestSpeedScores,
	calculateDaysSince,
} from '@automattic/jetpack-boost-score-api';
import { Spinner, BoostScoreBar } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { arrowUp, Icon } from '@wordpress/icons';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { useBoostTooltipCopy } from './use-boost-tooltip-copy';
import type { SpeedScores, BoostSpeedScoreType } from './types';
import type { SetStateAction } from 'react';

import './style.scss';

/**
 * Creates the text read by screen readers for the Boost Speed Score card.
 *
 * @param {string} speedLetterGrade     - Letter grade for the speed score (e.g. 'A', 'B', etc)
 * @param {number} currentSpeedScore    - Current numerical speed score (0-100)
 * @param {number} [boostScoreIncrease] - Optional score increase/decrease amount
 * @param {string} [cta]                - Optional call-to-action text
 * @return {string} Screen reader text describing the speed score
 */

const createSpeedScoreSRText = (
	speedLetterGrade: string,
	currentSpeedScore: number,
	boostScoreIncrease?: number,
	cta?: string
) => {
	if ( ! speedLetterGrade || typeof currentSpeedScore !== 'number' ) {
		return '';
	}

	const fragments = [];

	fragments.push(
		sprintf(
			// translators: %1$s: speed grade (e.g. 'A'), %2$s: numerical speed score (e.g. '95').
			__( 'Your website’s overall speed score is %1$s, or %2$s out of 100.', 'jetpack-my-jetpack' ),
			speedLetterGrade,
			currentSpeedScore
		)
	);

	if ( typeof boostScoreIncrease === 'number' ) {
		fragments.push(
			boostScoreIncrease > 0
				? sprintf(
						// translators: %s: score increase (e.g. '10')
						__( 'Your website’s overall speed score increased by %s.', 'jetpack-my-jetpack' ),
						boostScoreIncrease
				  )
				: sprintf(
						// translators: %s: score increase (e.g. '10')
						__( 'Your website’s overall speed score decreased by %s.', 'jetpack-my-jetpack' ),
						boostScoreIncrease
				  )
		);
	}

	if ( cta ) {
		fragments.push( cta );
	}

	return fragments.join( ' ' );
};

const BoostSpeedScore: BoostSpeedScoreType = () => {
	const { recordEvent } = useAnalytics();
	const [ isLoading, setIsLoading ] = useState( false );
	const [ speedLetterGrade, setSpeedLetterGrade ] = useState( '' );
	const [ currentSpeedScore, setCurrentSpeedScore ] = useState< number | null >( null );
	const [ previousSpeedScore, setPreviousSpeedScore ] = useState< number | null >( null );
	const [ isSpeedScoreError, setIsSpeedScoreError ] = useState( false );
	const [ shouldShowTooltip, setShouldShowTooltip ] = useState( false );
	const [ hasTooltipBeenViewed, setHasTooltipBeenViewed ] = useState( false );
	const isMobileViewport: boolean = useViewportMatch( 'medium', '<' );

	const { siteUrl = '', latestBoostSpeedScores } = getMyJetpackWindowInitialState();
	const { apiRoot, apiNonce, isSiteConnected } = useMyJetpackConnection();
	const slug = 'boost';
	const { detail } = useProduct( slug );
	const { status } = detail;
	const isBoostActive =
		status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const getAverageSpeedScore = ( mobileScore: number, desktopScore: number ) => {
		return Math.round( ( mobileScore + desktopScore ) / 2 );
	};

	const updateScores = (
		setScores: ( value: SetStateAction< number > ) => void,
		scores: SpeedScores[ 'scores' ]
	) => {
		const { mobile, desktop } = scores || {};
		if ( mobile && desktop ) {
			setScores( getAverageSpeedScore( mobile, desktop ) );
		}
	};

	const updateLetterGrade = ( scores: SpeedScores[ 'scores' ] ) => {
		const { mobile, desktop } = scores || {};
		if ( mobile && desktop ) {
			setSpeedLetterGrade( getScoreLetter( mobile, desktop ) );
		}
	};

	const setScoresFromCache = ( cachedSpeedScores: SpeedScores ) => {
		const { scores, previousScores } = cachedSpeedScores || {};

		updateScores( setCurrentSpeedScore, scores );
		updateScores( setPreviousSpeedScore, previousScores );
		updateLetterGrade( scores );
	};

	const getSpeedScores = async () => {
		if ( ! isSiteConnected ) {
			// Don't show the Boost Score
			setIsSpeedScoreError( true );
			return;
		}

		setIsLoading( true );
		requestSpeedScores( true, apiRoot, siteUrl, apiNonce )
			.then( scores => {
				const scoreLetter = getScoreLetter( scores.current.mobile, scores.current.desktop );
				setSpeedLetterGrade( scoreLetter );
				updateScores( setCurrentSpeedScore, scores.current );
				updateScores( setPreviousSpeedScore, latestBoostSpeedScores.scores );
				setIsLoading( false );
			} )
			.catch( err => {
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
			} );
	};

	const boostScoreIncrease = useMemo( () => {
		if ( ! previousSpeedScore || ! currentSpeedScore ) {
			return null;
		}

		// Only return an increase. Don't return a negative value (decrease).
		if ( currentSpeedScore < previousSpeedScore ) {
			return null;
		}

		return currentSpeedScore - previousSpeedScore;
	}, [ currentSpeedScore, previousSpeedScore ] );

	const tooltipCopy = useBoostTooltipCopy( { speedLetterGrade, boostScoreIncrease } );

	const handleEnter = useCallback( () => {
		setShouldShowTooltip( true );
	}, [ setShouldShowTooltip ] );

	const handleOut = useCallback( () => {
		setShouldShowTooltip( false );
	}, [ setShouldShowTooltip ] );

	useEffect( () => {
		if ( latestBoostSpeedScores ) {
			if ( isBoostActive ) {
				if ( calculateDaysSince( latestBoostSpeedScores.timestamp * 1000 ) < 1 ) {
					// When Boost plugin installed & active, use cache scores if they are less than 1 day old.
					// In other words, calculate a new score once every day.
					setScoresFromCache( latestBoostSpeedScores );
				} else {
					// Boost is active and cache scores are 1 or more days old.
					getSpeedScores();
				}
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

	useEffect( () => {
		if ( ! isLoading && shouldShowTooltip && ! hasTooltipBeenViewed ) {
			recordEvent( 'jetpack_boost_card_tooltip_viewed', {
				feature: 'jetpack-boost',
				position: 'my-jetpack',
			} );
			setHasTooltipBeenViewed( true );
		}
	}, [ isLoading, shouldShowTooltip, recordEvent, hasTooltipBeenViewed ] );

	return (
		! isSpeedScoreError && (
			<div
				className="mj-boost-speed-score"
				role="presentation"
				onMouseEnter={ handleEnter }
				onMouseLeave={ handleOut }
				onClick={ shouldShowTooltip ? handleOut : handleEnter }
				onFocus={ handleEnter }
				onBlur={ handleOut }
			>
				{ isLoading ? (
					<Spinner color="#23282d" size={ 16 } />
				) : (
					<>
						<div className="screen-reader-text">
							{ createSpeedScoreSRText(
								speedLetterGrade,
								currentSpeedScore,
								boostScoreIncrease,
								tooltipCopy
							) }
						</div>
						<div aria-hidden="true">
							<div className="mj-boost-speed-score__grade">
								<span>{ __( 'Your website’s overall speed score:', 'jetpack-my-jetpack' ) }</span>
								<span className="mj-boost-speed-score__grade--letter">
									{ speedLetterGrade }
									{ ! isLoading && shouldShowTooltip && (
										<Popover
											placement={ isMobileViewport ? 'top-end' : 'top-start' }
											noArrow={ false }
											offset={ 10 }
										>
											<div className={ 'boost-score-tooltip__parent' }>
												<p className={ 'boost-score-tooltip__heading' }>
													{ /* Add the `&nbsp;` at the end to prevent widows. */ }
													{ __( 'Site speed performance:', 'jetpack-my-jetpack' ) }&nbsp;
													{ speedLetterGrade }
												</p>
												<p className={ 'boost-score-tooltip__content' }>{ tooltipCopy }</p>
											</div>
										</Popover>
									) }
								</span>
							</div>
							<div className="mj-boost-speed-score__bar">
								<BoostScoreBar
									score={ currentSpeedScore }
									active={ currentSpeedScore > 0 }
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
						</div>
					</>
				) }
			</div>
		)
	);
};

export default BoostSpeedScore;
